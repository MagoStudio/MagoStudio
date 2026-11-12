import { execFile } from "node:child_process";
import { readdir, stat, statfs } from "node:fs/promises";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { defaultModelPreferences } from "../../shared/defaultModelPreferences";
import { findFilenameIgnoringCase } from "../../shared/findFilenameIgnoringCase";
import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";
import { LOCAL_MODEL_BUNDLES } from "../../shared/localModelManifest";
import type {
  EndpointModelSettings,
  ModelCheckRequest,
  ModelComponentDefinition,
  ModelOperationResult,
  ModelSettingsMutation,
  ModelSettingsRequest,
  ModelSettingsSnapshot
} from "../../shared/modelSettings";
import { resolveModelVariant } from "../../shared/resolveModelVariant";
import { asRecord } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";
import type { ComfyGraph } from "../comfy/comfyGraph";
import { normalizeComfyEndpoint } from "../comfy/normalizeComfyEndpoint";
import type { LibrarySettings } from "../librarySettings";
import { findComfyPython } from "../localSetup/findComfyPython";
import { hashFile } from "../localSetup/hashFile";
import { probeHardware } from "../localSetup/probeHardware";
import { inferSetupFolders } from "../localSetup/setupDestinations";
import { resolveAppFolder } from "../resolveAppFolder";

import { applyModelGraphSettings } from "./applyModelGraphSettings";
import { findComfyNodeRequirement } from "./findComfyNodeRequirement";
import { findNewestRecordedResult } from "./findNewestRecordedResult";
import { listModelTypeWorkflowNodes } from "./listModelTypeWorkflowNodes";
import { ModelSettingsStore, type CachedModelHost } from "./ModelSettingsStore";
import { readLlamaCppPackageInstalled } from "./readLlamaCppPackageInstalled";
import {
  hasModelFileCheckSucceeded,
  readModelFileCheckStatus
} from "./readModelFileCheckStatus";
import { repairGpuRuntime } from "./repairGpuRuntime";
import { repairLlamaRuntime } from "./repairLlamaRuntime";
import { resolveModelProblem } from "./resolveModelProblem";
import { runModelProbe } from "./runModelProbe";
import { selectComfyLoaderForModelFile } from "./selectComfyLoaderForModelFile";
import { summarizeLatestFileCheck } from "./summarizeLatestFileCheck";

const QWEN_TRANSFORMER_LAYERS = 64;
const ALL_GPU_LAYERS = -1;
const MAX_INVENTORY_FILES = 10000;
const BYTES_RESERVED_PER_CONTEXT_TOKEN = 32768;
const HEADER_PROBE_TIMEOUT_MS = 60_000;
const HOST_REFRESH_INTERVAL_MS = 30_000;

const aliases: Record<string, string[]> = {
  unet: ["unet", "diffusion_models"],
  diffusion_models: ["diffusion_models", "unet"],
  text_encoders: ["text_encoders", "clip", "clip_gguf"]
};
const sameComputer = (endpoint: string) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname);
const manifests = LOCAL_MODEL_BUNDLES.flatMap((bundle) => bundle.files);
const findManifestFileByFilename = (filename: string) =>
  manifests.find(
    (model) =>
      model.targetPath.split("/").pop()?.toLowerCase() ===
      filename.toLowerCase()
  );
const operationKey = (
  model: string,
  variant: string,
  role: string,
  filename: string
) => `${model}:${variant}:${role}:${filename}`;
const loadTestKey = (fileOperationKey: string) => `${fileOperationKey}:load`;
const hashKey = (fileOperationKey: string) => `${fileOperationKey}:hash`;

export class ModelSettingsService {
  private hosts = new Map<
    string,
    { available: boolean; objects: Record<string, unknown>; checked: number }
  >();
  private refreshes = new Map<string, Promise<void>>();
  private operations = new Set<string>();
  constructor(
    readonly store: ModelSettingsStore,
    private readonly settings: LibrarySettings,
    private readonly build: {
      version: string;
      commit: string;
      development: boolean;
    }
  ) {}

  async endpoint(value?: string): Promise<string> {
    return normalizeComfyEndpoint(
      value ?? (await this.settings.getComfyEndpoint())
    );
  }

  async observe(
    endpoint: string,
    stats: Record<string, unknown>
  ): Promise<void> {
    const system = asRecord(stats.system);
    const prior = await this.store.endpoint(endpoint);
    const inferred = inferSetupFolders(stats, null);
    const host: CachedModelHost = {
      lastSeenAt: new Date().toISOString(),
      version:
        typeof system?.comfyui_version === "string"
          ? system.comfyui_version
          : (prior.host?.version ?? null),
      pythonVersion:
        typeof system?.python_version === "string"
          ? system.python_version
          : (prior.host?.pythonVersion ?? null),
      root: inferred.root ?? prior.host?.root ?? null,
      categories: prior.host?.categories ?? {},
      files: prior.host?.files ?? {},
      devices: Array.isArray(stats.devices)
        ? stats.devices.map((value) => {
            const d = asRecord(value);
            return {
              name: d?.name,
              type: d?.type,
              vram_total: d?.vram_total,
              vram_free: d?.vram_free,
              torch_vram_total: d?.torch_vram_total,
              torch_vram_free: d?.torch_vram_free
            };
          })
        : []
    };
    await this.store.update(endpoint, (current) => ({ ...current, host }));
  }

  refresh(endpoint: string): Promise<void> {
    const pending = this.refreshes.get(endpoint);
    if (pending) return pending;
    const refresh = this.refreshHost(endpoint).finally(() =>
      this.refreshes.delete(endpoint)
    );
    this.refreshes.set(endpoint, refresh);
    return refresh;
  }

  private async refreshHost(endpoint: string): Promise<void> {
    try {
      const client = new ComfyClient(endpoint);
      const [stats, objects, inventory] = await Promise.all([
        client.getJson("/system_stats"),
        client.getJson("/object_info"),
        client.getJson("/experiment/models").catch(() => null)
      ]);
      await this.observe(endpoint, stats);
      const folders = inferSetupFolders(stats, inventory);
      const prior = await this.store.endpoint(endpoint);
      const categories = { ...prior.host?.categories, ...folders.categories };
      const files: Record<string, string[]> = {};
      for (const category of new Set(
        LOCAL_MODEL_DEFINITIONS.flatMap((model) =>
          model.variants.flatMap((variant) =>
            variant.components.map((component) => component.category)
          )
        )
      )) {
        const advertised = await client
          .getJson(`/models/${encodeURIComponent(category)}`)
          .catch(() => null);
        const names = Array.isArray(advertised)
          ? advertised.filter(
              (value): value is string => typeof value === "string"
            )
          : [];
        if (sameComputer(endpoint))
          for (const root of (aliases[category] ?? [category]).flatMap(
            (key) => categories[key] ?? []
          ))
            names.push(
              ...(await readdir(root, { recursive: true }).catch(() => []))
                .filter((name) => /\.(gguf|safetensors)$/i.test(name))
                .map((name) => name.replaceAll("\\", "/"))
            );
        files[category] = [...new Set(names)].slice(0, MAX_INVENTORY_FILES);
      }
      await this.store.update(endpoint, (current) => ({
        ...current,
        host: current.host
          ? {
              ...current.host,
              root: folders.root ?? current.host.root,
              categories,
              files
            }
          : undefined
      }));
      this.hosts.set(endpoint, {
        available: true,
        objects,
        checked: Date.now()
      });
    } catch {
      this.hosts.set(endpoint, {
        available: false,
        objects: {},
        checked: Date.now()
      });
    }
  }

  private async preferences(endpoint: string): Promise<EndpointModelSettings> {
    return (
      (await this.store.endpoint(endpoint)).settings ?? {
        models: {},
        memoryPolicy: "auto"
      }
    );
  }

  private async filePath(
    endpoint: string,
    component: ModelComponentDefinition,
    filename: string
  ): Promise<string | null> {
    if (!sameComputer(endpoint)) return null;
    const host = (await this.store.endpoint(endpoint)).host;
    const roots = (aliases[component.category] ?? [component.category]).flatMap(
      (category) => host?.categories[category] ?? []
    );
    if (host?.root)
      roots.push(path.join(host.root, "models", component.category));
    for (const root of roots) {
      const candidate = path.resolve(root, filename);
      const relative = path.relative(path.resolve(root), candidate);
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
      if ((await stat(candidate).catch(() => null))?.isFile()) return candidate;
    }
    return null;
  }

  private capabilities(endpoint: string) {
    const objects = this.hosts.get(endpoint)?.objects ?? {};
    const inputs = asRecord(asRecord(objects.CLIPLoader)?.input);
    const device =
      asRecord(inputs?.optional)?.device ?? asRecord(inputs?.required)?.device;
    const tiled = asRecord(asRecord(objects.VAEDecodeTiled)?.input);
    const tiledDecodeInputs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries({
      ...asRecord(tiled?.required),
      ...asRecord(tiled?.optional)
    })) {
      if (!Array.isArray(value)) continue;
      const options = asRecord(value[1]);
      if (options && "default" in options)
        tiledDecodeInputs[key] = options.default;
    }
    return {
      encoderCpu:
        Array.isArray(device) &&
        Array.isArray(device[0]) &&
        device[0].includes("cpu"),
      tiledDecode: !!objects.VAEDecodeTiled,
      tiledDecodeInputs
    };
  }

  async inspect(
    request: ModelSettingsRequest,
    refresh = true
  ): Promise<ModelSettingsSnapshot> {
    const endpoint = await this.endpoint(request.endpoint);
    if (refresh) await this.refresh(endpoint);
    const stored = await this.store.endpoint(endpoint),
      settings = await this.preferences(endpoint);
    const definition = LOCAL_MODEL_DEFINITIONS.find(
      (model) => model.id === request.model
    )!;
    const preferences =
      settings.models[request.model] ??
      defaultModelPreferences(definition.defaultVariant);
    const setupTextVariant = await this.settings.getSetupScriptTextModel();
    const variant = resolveModelVariant(
      definition,
      preferences,
      setupTextVariant
    );
    const components = await Promise.all(
      variant.components.map(async (component) => {
        const selectedFile =
          preferences.bindings[`${variant.id}:${component.role}`] ??
          component.filename;
        const loaderForFile = (filename: string) =>
          selectComfyLoaderForModelFile({
            component,
            filename,
            runtime: definition.runtime
          });
        const host = this.hosts.get(endpoint);
        const missingNodesForFile = (filename: string) => {
          const fileLoader = loaderForFile(filename);
          const isLoaderMissingOnHost =
            !!host?.available && !host.objects[fileLoader];
          return isLoaderMissingOnHost
            ? [findComfyNodeRequirement(fileLoader)]
            : [];
        };
        const loader = loaderForFile(selectedFile);
        const node = asRecord(host?.objects[loader]);
        const inputs = asRecord(node?.input);
        const spec =
          asRecord(inputs?.required)?.[component.input] ??
          asRecord(inputs?.optional)?.[component.input];
        const advertised =
          Array.isArray(spec) && Array.isArray(spec[0])
            ? spec[0].filter(
                (value): value is string => typeof value === "string"
              )
            : [];
        const filenames = [
          ...new Set([
            ...(stored.host?.files[component.category] ?? []),
            ...advertised
          ])
        ];
        const modelFilePattern =
          definition.runtime === "llama"
            ? /\.gguf$/i
            : /\.(gguf|safetensors)$/i;
        const choices = await Promise.all(
          filenames
            .filter((filename) => modelFilePattern.test(filename))
            .map(async (filename) => {
              const choicePath = await this.filePath(
                endpoint,
                component,
                filename
              );
              const choiceOperationKey = operationKey(
                request.model,
                variant.id,
                component.role,
                filename
              );
              const latestCheckResult = stored.problems?.[choiceOperationKey];
              const latestLoadTestResult =
                stored.problems?.[loadTestKey(choiceOperationKey)];
              const hasRecordedFileCheck =
                latestCheckResult !== undefined ||
                latestLoadTestResult !== undefined;
              const storedChoiceHash = choicePath
                ? stored.hashes?.[choicePath]
                : undefined;
              const choiceInfo =
                choicePath && (hasRecordedFileCheck || storedChoiceHash)
                  ? await stat(choicePath).catch(() => null)
                  : null;
              const choiceManifestEntry = findManifestFileByFilename(filename);
              const isRecommendedChoice =
                filename.toLowerCase() === component.filename.toLowerCase();
              return {
                filename,
                path: choicePath,
                sourceUrl:
                  choiceManifestEntry?.url ??
                  (isRecommendedChoice
                    ? (component.downloadUrl ?? null)
                    : null),
                expectedSha256: choiceManifestEntry?.sha256 ?? null,
                actualSha256:
                  storedChoiceHash &&
                  choiceInfo &&
                  storedChoiceHash.size === choiceInfo.size &&
                  storedChoiceHash.modified === choiceInfo.mtimeMs
                    ? storedChoiceHash.sha256
                    : null,
                missingNodes: missingNodesForFile(filename),
                latestFileCheck: summarizeLatestFileCheck(
                  findNewestRecordedResult([
                    latestCheckResult,
                    stored.problems?.[hashKey(choiceOperationKey)]
                  ])
                ),
                ...readModelFileCheckStatus({
                  latestCheckResult,
                  latestLoadTestResult,
                  currentFile: choiceInfo
                    ? { size: choiceInfo.size, modified: choiceInfo.mtimeMs }
                    : null
                })
              };
            })
        );
        const installedRecommendedFilename = findFilenameIgnoringCase(
          choices.map((choice) => choice.filename),
          component.filename
        );
        const recommendedManifestEntry = findManifestFileByFilename(
          component.filename
        );
        const recommendedFile = {
          filename: installedRecommendedFilename ?? component.filename,
          isInstalled: installedRecommendedFilename !== undefined,
          setupDownloadName:
            recommendedManifestEntry?.targetPath.split("/").pop() ?? null,
          sourceUrl:
            recommendedManifestEntry?.url ?? component.downloadUrl ?? null
        };
        const file = await this.filePath(endpoint, component, selectedFile);
        const expected = findManifestFileByFilename(selectedFile);
        const selectedFileOperationKey = operationKey(
          request.model,
          variant.id,
          component.role,
          selectedFile
        );
        const info = file ? await stat(file) : null;
        const hash = file ? stored.hashes?.[file] : null;
        return {
          ...component,
          loader,
          selectedFile,
          choices,
          recommendedFile,
          path: file,
          sourceUrl:
            expected?.url ??
            (selectedFile === component.filename
              ? (component.downloadUrl ?? null)
              : null),
          expectedSha256: expected?.sha256 ?? null,
          actualSha256:
            hash &&
            info &&
            hash.size === info.size &&
            hash.modified === info.mtimeMs
              ? hash.sha256
              : null,
          status: !this.hosts.get(endpoint)?.available
            ? ("unknown" as const)
            : file || filenames.includes(selectedFile)
              ? ("installed" as const)
              : ("missing" as const),
          problem: resolveModelProblem(
            findNewestRecordedResult([
              stored.problems?.[selectedFileOperationKey],
              stored.problems?.[hashKey(selectedFileOperationKey)]
            ]),
            stored.problems?.[request.model]
          )
        };
      })
    );
    const local = sameComputer(endpoint);
    const python =
      local && stored.host?.root
        ? await findComfyPython({
            comfyDirectory: stored.host.root,
            reportedPythonVersion: stored.host.pythonVersion
          })
        : null;
    const inferred = await this.settings.getInferredComfyInstall();
    const modelsRoot = await this.settings.getLocalModelsRoot();
    const isComfyHostAvailable = this.hosts.get(endpoint)?.available ?? false;
    const comfyHostNodes = this.hosts.get(endpoint)?.objects ?? {};
    const missingWorkflowNodes = isComfyHostAvailable
      ? listModelTypeWorkflowNodes(request.model)
          .filter((nodeName) => !comfyHostNodes[nodeName])
          .map(findComfyNodeRequirement)
      : [];
    const isLlamaCppPackageInstalled =
      definition.runtime === "llama" && python
        ? await readLlamaCppPackageInstalled(python)
        : null;
    const root = stored.host?.root;
    const portable = root
      ? await Promise.all([
          stat(path.join(path.dirname(root), "run_nvidia_gpu.bat")).catch(
            () => null
          ),
          stat(
            path.join(path.dirname(root), "python_embeded", "python.exe")
          ).catch(() => null)
        ])
      : [];
    const managed =
      !!root &&
      local &&
      portable.length === 2 &&
      portable.every((file) => file?.isFile()) &&
      ((inferred?.endpoint === endpoint &&
        path.resolve(inferred.directory, "ComfyUI") === path.resolve(root)) ||
        (!!modelsRoot &&
          path.resolve(
            resolveAppFolder(modelsRoot),
            "ComfyUI_windows_portable",
            "ComfyUI"
          ) === path.resolve(root)));
    return {
      endpoint,
      settings,
      setupTextVariant,
      model: request.model,
      variant: variant.id,
      components,
      available: this.hosts.get(endpoint)?.available ?? false,
      comfyVersion: stored.host?.version ?? null,
      local,
      python,
      managed,
      capabilities: this.capabilities(endpoint),
      loadersAvailable: components.every(
        (component) => !!this.hosts.get(endpoint)?.objects[component.loader]
      ),
      missingWorkflowNodes,
      isLlamaCppPackageInstalled
    };
  }

  async save(request: ModelSettingsMutation): Promise<ModelSettingsSnapshot> {
    const snapshot = await this.inspect(request);
    const definition = LOCAL_MODEL_DEFINITIONS.find(
      (model) => model.id === request.model
    )!;
    if (
      ![
        definition.defaultVariant,
        ...definition.variants.map((variant) => variant.id)
      ].includes(request.preferences.variant)
    )
      throw new Error("Unknown model variant");
    if (
      request.preferences.encoderDevice === "cpu" &&
      !snapshot.capabilities.encoderCpu
    )
      throw new Error(
        "The connected loader does not support CPU text encoding"
      );
    if (
      request.preferences.tiledDecode &&
      (!definition.supportsTiledDecode || !snapshot.capabilities.tiledDecode)
    )
      throw new Error("Tiled VAE decoding is unavailable");
    if (
      request.memoryPolicy !== snapshot.settings.memoryPolicy &&
      !snapshot.managed
    )
      throw new Error(
        "Change the memory policy on the ComfyUI host before selecting it here"
      );
    const stored = await this.store.endpoint(snapshot.endpoint);
    for (const [key, filename] of Object.entries(
      request.preferences.bindings
    )) {
      const [variantId, role] = key.split(":");
      const component = definition.variants
        .find((variant) => variant.id === variantId)
        ?.components.find((component) => component.role === role);
      if (!component) throw new Error("Unknown model component binding");
      if (filename === component.filename) continue;
      const previous = snapshot.settings.models[request.model]?.bindings[key];
      if (previous === filename) continue;
      const fileOperationKey = operationKey(
        request.model,
        variantId,
        role,
        filename
      );
      const latestCheckResult = stored.problems?.[fileOperationKey];
      const latestLoadTestResult =
        stored.problems?.[loadTestKey(fileOperationKey)];
      const hasAnyPassedFileCheck = [
        latestCheckResult,
        latestLoadTestResult
      ].some(hasModelFileCheckSucceeded);
      if (!hasAnyPassedFileCheck)
        throw new Error(
          "Check the candidate model or successfully load it before selecting this file"
        );
      const file = await this.filePath(snapshot.endpoint, component, filename);
      const current = file ? await stat(file) : null;
      const checkStatus = current
        ? readModelFileCheckStatus({
            latestCheckResult,
            latestLoadTestResult,
            currentFile: { size: current.size, modified: current.mtimeMs }
          })
        : null;
      if (checkStatus?.loadTestOutcome === "failed")
        throw new Error(
          "This file failed its last load test. Test it again before selecting it."
        );
      if (!checkStatus?.hasPassedModelCheck)
        throw new Error(
          "The candidate changed after it was checked. Check it again before selecting it."
        );
    }
    await this.store.update(snapshot.endpoint, (current) => ({
      ...current,
      settings: {
        models: {
          ...current.settings?.models,
          [request.model]: request.preferences
        },
        memoryPolicy: request.memoryPolicy
      }
    }));
    return this.inspect(request, false);
  }

  async check(request: ModelCheckRequest): Promise<ModelOperationResult> {
    const endpoint = await this.endpoint(request.endpoint);
    if (this.operations.has(endpoint))
      throw new Error("A model check is already running for this ComfyUI host");
    this.operations.add(endpoint);
    let fileUnderTest: { operationKey: string; path: string } | undefined;
    try {
      const snapshot = await this.inspect(request);
      const component = snapshot.components.find(
        (component) => component.role === (request.role ?? "main")
      );
      if (!component) throw new Error("Unknown component for this variant");
      const filename = request.filename ?? component.selectedFile;
      const candidate = component.choices.find(
        (choice) => choice.filename === filename
      );
      const file =
        filename === component.selectedFile ? component.path : candidate?.path;
      const beforeProbe = file ? await stat(file).catch(() => null) : null;
      let result: ModelOperationResult;
      let wasLoadTestStoppedByHeaderCheck = false;
      if (request.action === "hash") {
        if (!file)
          throw new Error(
            "Hashing requires a local model file on the connected ComfyUI host"
          );
        const before = await stat(file),
          sha256 = await hashFile(file),
          after = await stat(file);
        if (before.size !== after.size || before.mtimeMs !== after.mtimeMs)
          throw new Error("The model file changed while hashing");
        await this.store.update(endpoint, (current) => ({
          ...current,
          hashes: {
            ...current.hashes,
            [file]: { size: after.size, modified: after.mtimeMs, sha256 }
          }
        }));
        const expectedSha256OfHashedFile =
          findManifestFileByFilename(filename)?.sha256;
        result = {
          status:
            expectedSha256OfHashedFile && sha256 !== expectedSha256OfHashedFile
              ? "mismatch"
              : "success",
          message: sha256,
          details: { sha256 }
        };
      } else {
        if (!snapshot.python)
          return {
            status: "unsupported",
            message:
              "The connected ComfyUI interpreter could not be verified on this computer. Run the check on its host."
          };
        if (!snapshot.available)
          throw new Error("Reconnect ComfyUI before running model checks");
        if (request.action === "runtime") {
          result = await runModelProbe(snapshot.python, { action: "runtime" });
          const preferences = snapshot.settings.models[request.model];
          const gpuExpected =
            Number(result.details?.cudaDriverVersion) > 0 ||
            result.details?.metal === true;
          const gpuAvailable =
            request.model === "text"
              ? result.details?.llamaGpu === true
              : result.details?.torchGpu === true ||
                result.details?.metal === true;
          if (
            gpuExpected &&
            !gpuAvailable &&
            !(request.model === "text" && preferences?.text.mode === "cpu")
          )
            result = {
              ...result,
              status: "error",
              message:
                "A GPU is present, but this runtime initialized only a CPU backend. Repair the GPU runtime or explicitly select CPU mode."
            };
          if (snapshot.isLlamaCppPackageInstalled === false)
            result = {
              ...result,
              status: "error",
              message:
                "llama-cpp-python is not installed in ComfyUI's Python. Use Repair GPU runtime to install it."
            };
          const missingComfyNodes = [
            ...snapshot.components
              .map((component) => component.loader)
              .filter((loader) => !this.hosts.get(endpoint)?.objects[loader]),
            ...snapshot.missingWorkflowNodes.map(
              (requirement) => requirement.name
            )
          ];
          if (missingComfyNodes.length)
            result = {
              ...result,
              status: "error",
              message: `Required ComfyUI nodes are unavailable: ${[...new Set(missingComfyNodes)].join(", ")}`,
              details: { ...result.details, missingComfyNodes }
            };
          await this.store.update(endpoint, (current) => ({
            ...current,
            runtime: { ...current.runtime, [request.model]: result }
          }));
        } else if (request.action === "repair") {
          await this.assertIdle(endpoint);
          result =
            request.model === "text"
              ? await repairLlamaRuntime(snapshot.python)
              : await repairGpuRuntime(snapshot.python, "torch");
        } else {
          if (!file)
            throw new Error(
              "Select an installed local file from this ComfyUI host"
            );
          const reference = await this.filePath(
            endpoint,
            component,
            component.filename
          );
          const markFileUnderTest = () => {
            fileUnderTest = {
              operationKey: operationKey(
                request.model,
                snapshot.variant,
                component.role,
                filename
              ),
              path: file
            };
          };
          if (request.action === "compatibility") {
            markFileUnderTest();
            result = await runModelProbe(
              snapshot.python,
              {
                action: "compatibility",
                model: request.model,
                role: component.role,
                path: file,
                reference
              },
              HEADER_PROBE_TIMEOUT_MS
            );
          } else {
            await this.assertIdle(endpoint);
            markFileUnderTest();
            const header = await runModelProbe(
              snapshot.python,
              {
                action: "compatibility",
                model: request.model,
                role: component.role,
                path: file,
                reference
              },
              HEADER_PROBE_TIMEOUT_MS
            );
            const isHeaderIncompatible =
              header.status === "mismatch" || header.status === "error";
            if (isHeaderIncompatible) {
              result = header;
              wasLoadTestStoppedByHeaderCheck = true;
            } else {
              await new ComfyClient(endpoint).request("/free", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unload_models: true, free_memory: true })
              });
              await new ComfyClient(endpoint).getJson("/system_stats");
              const definition = LOCAL_MODEL_DEFINITIONS.find(
                (model) => model.id === request.model
              )!;
              const preferences =
                snapshot.settings.models[request.model] ??
                defaultModelPreferences(definition.defaultVariant);
              const runtime = definition.runtime;
              const loader = selectComfyLoaderForModelFile({
                component,
                filename,
                runtime
              });
              if (
                runtime === "comfy" &&
                !this.hosts.get(endpoint)?.objects[loader]
              )
                throw new Error(`Required loader is missing: ${loader}`);
              const stored = await this.store.endpoint(endpoint);
              const main = snapshot.components[0];
              const baseLoader = selectComfyLoaderForModelFile({
                component: main,
                filename: main.selectedFile,
                runtime
              });
              const layers = await this.textLayers(
                snapshot.endpoint,
                file,
                preferences.text
              );
              result = await runModelProbe(snapshot.python, {
                action: "load",
                model: request.model,
                role: component.role,
                path: file,
                root: stored.host?.root,
                categories: stored.host?.categories,
                loader,
                baseLoader,
                memoryPolicy: snapshot.settings.memoryPolicy,
                baseInputs: { [main.input]: main.selectedFile },
                inputs: {
                  [component.input]: filename,
                  ...(component.clipType
                    ? {
                        type: component.clipType,
                        device: preferences.encoderDevice
                      }
                    : {})
                },
                options: {
                  layers,
                  context: preferences.text.context,
                  batch: preferences.text.batch,
                  offloadCache: layers !== 0 && preferences.text.offloadCache,
                  memoryMap: preferences.text.memoryMap
                }
              });
            }
          }
        }
      }
      const fingerprint = file ? await stat(file).catch(() => null) : null;
      if (
        result.status === "success" &&
        beforeProbe &&
        (beforeProbe.size !== fingerprint?.size ||
          beforeProbe.mtimeMs !== fingerprint?.mtimeMs)
      )
        result = {
          status: "error",
          message:
            "The model file changed while it was being checked. Check it again."
        };
      result = {
        ...result,
        details: {
          ...result.details,
          action: request.action,
          ...(fingerprint
            ? { size: fingerprint.size, modified: fingerprint.mtimeMs }
            : {})
        }
      };
      const fileOperationKey = operationKey(
        request.model,
        snapshot.variant,
        component.role,
        filename
      );
      await this.store.recordProblem(
        endpoint,
        request.action === "hash"
          ? hashKey(fileOperationKey)
          : fileOperationKey,
        result
      );
      if (request.action === "load")
        await this.store.recordProblem(
          endpoint,
          loadTestKey(fileOperationKey),
          result
        );
      const isModelLevelResult =
        request.action !== "compatibility" &&
        request.action !== "hash" &&
        !wasLoadTestStoppedByHeaderCheck;
      if (isModelLevelResult)
        await this.store.recordProblem(endpoint, request.model, result);
      return result;
    } catch (error) {
      const result: ModelOperationResult = {
        status: "error",
        message: error instanceof Error ? error.message : String(error)
      };
      await this.store.recordProblem(endpoint, request.model, result);
      if (fileUnderTest)
        await this.recordFailedFileCheck(
          endpoint,
          request.action,
          fileUnderTest,
          result
        );
      return result;
    } finally {
      this.operations.delete(endpoint);
    }
  }

  private async recordFailedFileCheck(
    endpoint: string,
    action: ModelCheckRequest["action"],
    fileUnderTest: { operationKey: string; path: string },
    failure: ModelOperationResult
  ): Promise<void> {
    const fingerprint = await stat(fileUnderTest.path).catch(() => null);
    const result: ModelOperationResult = {
      ...failure,
      details: {
        action,
        ...(fingerprint
          ? { size: fingerprint.size, modified: fingerprint.mtimeMs }
          : {})
      }
    };
    await this.store.recordProblem(
      endpoint,
      fileUnderTest.operationKey,
      result
    );
    if (action === "load")
      await this.store.recordProblem(
        endpoint,
        loadTestKey(fileUnderTest.operationKey),
        result
      );
  }

  private async assertIdle(endpoint: string): Promise<void> {
    const queue = await new ComfyClient(endpoint).getJson("/queue");
    if (
      (Array.isArray(queue.queue_running) && queue.queue_running.length) ||
      (Array.isArray(queue.queue_pending) && queue.queue_pending.length)
    )
      throw new Error(
        "Wait until ComfyUI's render queue is empty before checking model loads or repairing dependencies"
      );
  }

  private async textLayers(
    endpoint: string,
    file: string | null,
    settings: { mode: string; gpuLayers: number; context: number },
    fallbackBytes = 0
  ): Promise<number> {
    if (settings.mode === "cpu") return 0;
    if (settings.mode === "all") return -1;
    if (settings.mode === "custom") return settings.gpuLayers;
    const stored = await this.store.endpoint(endpoint);
    const totalVram = Math.max(
      0,
      ...(stored.host?.devices ?? []).map((device) => {
        const d = asRecord(device);
        if (d?.type === "cpu") return 0;
        return typeof d?.vram_total === "number" ? d.vram_total : 0;
      })
    );
    const bytes = file
      ? ((await stat(file).catch(() => null))?.size ?? fallbackBytes)
      : fallbackBytes;
    if (!totalVram || !bytes) return 0;
    const baseReserveBytes = 2147483648;
    const reserve =
      baseReserveBytes + settings.context * BYTES_RESERVED_PER_CONTEXT_TOKEN;
    const layersThatFit = Math.floor(
      ((totalVram - reserve) / bytes) * QWEN_TRANSFORMER_LAYERS
    );
    if (layersThatFit >= QWEN_TRANSFORMER_LAYERS) return ALL_GPU_LAYERS;
    return Math.max(0, layersThatFit);
  }

  async prepare(endpoint: string, graph: ComfyGraph): Promise<ComfyGraph> {
    const known = Object.values(graph).some(
      (node) =>
        node.class_type === "SimpleQwenVLggufV2" ||
        LOCAL_MODEL_DEFINITIONS.some((model) =>
          model.variants.some((variant) =>
            variant.components.some(
              (component) =>
                component.role === "main" &&
                [
                  component.filename,
                  ...(component.workflowFilenames ?? [])
                ].includes(String(node.inputs[component.input]))
            )
          )
        )
    );
    if (!known) return graph;
    if (
      Date.now() - (this.hosts.get(endpoint)?.checked ?? 0) >
      HOST_REFRESH_INTERVAL_MS
    )
      await this.refresh(endpoint);
    const preferences = await this.preferences(endpoint),
      setup = await this.settings.getSetupScriptTextModel();
    const text = LOCAL_MODEL_DEFINITIONS[0],
      textSettings = preferences.models.text ?? defaultModelPreferences("auto"),
      variant = resolveModelVariant(text, textSettings, setup);
    const file =
      textSettings.bindings[`${variant.id}:main`] ??
      variant.components[0].filename;
    const textPath = await this.filePath(endpoint, variant.components[0], file);
    const hasText = Object.values(graph).some(
      (node) =>
        node.class_type === "SimpleQwenVLggufV2" &&
        Array.isArray(node.inputs.config_override)
    );
    if (hasText && textSettings.bindings[`${variant.id}:main`] && !textPath)
      throw new Error(
        "The custom text model file is unavailable on this ComfyUI host"
      );
    return applyModelGraphSettings(
      graph,
      preferences,
      setup,
      await this.textLayers(
        endpoint,
        textPath,
        textSettings.text,
        manifests.find((model) => model.targetPath.split("/").pop() === file)
          ?.bytes ?? 0
      ),
      textPath ?? undefined,
      this.capabilities(endpoint)
    );
  }

  async textModelPath(endpoint: string): Promise<string | null> {
    if (
      Date.now() - (this.hosts.get(endpoint)?.checked ?? 0) >
      HOST_REFRESH_INTERVAL_MS
    )
      await this.refresh(endpoint);
    const preferences = await this.preferences(endpoint);
    const definition = LOCAL_MODEL_DEFINITIONS.find(
      (model) => model.id === "text"
    )!;
    const selected = preferences.models.text ?? defaultModelPreferences("auto");
    const variant = resolveModelVariant(
      definition,
      selected,
      await this.settings.getSetupScriptTextModel()
    );
    const custom = selected.bindings[`${variant.id}:main`];
    if (!custom) return null;
    const file = await this.filePath(endpoint, variant.components[0], custom);
    if (!file)
      throw new Error(
        "The selected custom text model is unavailable on this ComfyUI host"
      );
    return file;
  }

  async recordFailure(
    endpoint: string,
    message: string,
    graph: ComfyGraph
  ): Promise<void> {
    const preferences = await this.preferences(endpoint);
    for (const definition of LOCAL_MODEL_DEFINITIONS) {
      const names = new Set(
        definition.variants.flatMap((variant) =>
          variant.components
            .filter((component) => component.role === "main")
            .flatMap((component) => [
              component.filename,
              ...(component.workflowFilenames ?? [])
            ])
        )
      );
      for (const file of Object.values(
        preferences.models[definition.id]?.bindings ?? {}
      ))
        names.add(file);
      const involved = Object.values(graph).some((node) =>
        definition.id === "text"
          ? node.class_type === "SimpleQwenVLggufV2"
          : typeof node.inputs.unet_name === "string" &&
            names.has(node.inputs.unet_name)
      );
      if (involved)
        await this.store.recordProblem(endpoint, definition.id, {
          status: "error",
          message,
          details: {
            kind: /out of memory|cudaMalloc|failed to allocate.*(?:CUDA|GPU)/i.test(
              message
            )
              ? "gpu-memory"
              : "load-failure",
            recordedAt: new Date().toISOString()
          }
        });
    }
  }

  async diagnostics(value?: string): Promise<Record<string, unknown>> {
    const endpoint = await this.endpoint(value);
    await this.refresh(endpoint);
    const stored = await this.store.endpoint(endpoint),
      hardware = await probeHardware();
    const root =
      stored.host?.root && sameComputer(endpoint)
        ? stored.host.root
        : await this.settings.getLibraryRoot();
    const disk = await statfs(root)
      .then((info) => ({
        path: root,
        freeBytes: Number(info.bavail) * Number(info.bsize)
      }))
      .catch(() => null);
    const gpu = await promisify(execFile)(
      "nvidia-smi",
      [
        "--query-gpu=name,memory.total,memory.free,driver_version",
        "--format=csv,noheader,nounits"
      ],
      { windowsHide: true, timeout: 5000 }
    )
      .then((value) => value.stdout.trim())
      .catch(() => null);
    const models = await Promise.all(
      LOCAL_MODEL_DEFINITIONS.map((model) =>
        this.inspect({ model: model.id, endpoint }, false)
      )
    );
    const inventoryFiles = new Map<
      string,
      { targetPath: string; url?: string; sha256?: string }
    >(manifests.map((file) => [file.targetPath, file]));
    for (const definition of LOCAL_MODEL_DEFINITIONS)
      for (const variant of definition.variants)
        for (const component of variant.components) {
          const targetPath = `models/${component.category}/${component.filename}`;
          if (!inventoryFiles.has(targetPath))
            inventoryFiles.set(targetPath, {
              targetPath,
              url: component.downloadUrl
            });
        }
    const inventory = await Promise.all(
      [...inventoryFiles.values()].map(async (file) => {
        const parts = file.targetPath.split("/");
        const filename = parts.pop()!;
        const category = parts.slice(1).join("/");
        const absolute = await this.filePath(
          endpoint,
          { role: "main", filename, category, loader: "", input: "" },
          filename
        );
        const info = absolute ? await stat(absolute).catch(() => null) : null;
        const hash = absolute ? stored.hashes?.[absolute] : null;
        return {
          targetPath: file.targetPath,
          path: absolute,
          sourceUrl: file.url ?? null,
          expectedSha256: file.sha256 ?? null,
          actualSha256:
            info &&
            hash &&
            hash.size === info.size &&
            hash.modified === info.mtimeMs
              ? hash.sha256
              : null,
          status: !this.hosts.get(endpoint)?.available
            ? "unknown"
            : absolute || stored.host?.files[category]?.includes(filename)
              ? "installed"
              : "missing",
          problem:
            Object.entries(stored.problems ?? {}).find(
              ([key, result]) =>
                key.endsWith(`:${filename}`) && result.status !== "success"
            )?.[1] ?? null
        };
      })
    );
    const modelsRoot = await this.settings.getLocalModelsRoot();
    const engineMarker = modelsRoot
      ? await stat(
          path.join(
            resolveAppFolder(modelsRoot),
            ".downloads",
            "engine-installed.json"
          )
        ).catch(() => null)
      : null;
    return {
      capturedAt: new Date().toISOString(),
      mago: this.build,
      endpoint,
      setupKind: !sameComputer(endpoint)
        ? "external-url"
        : engineMarker &&
            modelsRoot &&
            stored.host?.root &&
            path.resolve(stored.host.root) ===
              path.resolve(
                resolveAppFolder(modelsRoot),
                "ComfyUI_windows_portable",
                "ComfyUI"
              )
          ? "wizard"
          : "existing-local",
      setupCompleted: await this.settings.hasCompletedLocalSetup(),
      hardware: {
        scope: "Mago computer",
        platform: platform(),
        release: release(),
        cpu: cpus()[0]?.model ?? null,
        ramTotalBytes: totalmem(),
        ramFreeBytes: freemem(),
        graphics: hardware.graphicsCards ?? hardware.graphicsCardName,
        nvidia: { units: "MiB", csv: gpu },
        disk
      },
      comfy: {
        available: this.hosts.get(endpoint)?.available ?? false,
        lastSeenAt: stored.host?.lastSeenAt ?? null,
        version: stored.host?.version ?? null,
        pythonVersion: stored.host?.pythonVersion ?? null,
        devices: stored.host?.devices ?? [],
        hardwareScope: sameComputer(endpoint)
          ? "same computer"
          : "remote ComfyUI host",
        stale: !this.hosts.get(endpoint)?.available
      },
      models: models.map((model) => ({
        model: model.model,
        variant: model.variant,
        settings: model.settings.models[model.model],
        python: model.python,
        managed: model.managed,
        files: model.components.map(({ choices, ...component }) => component)
      })),
      inventory,
      runtime: stored.runtime ?? {},
      problems: stored.problems ?? {}
    };
  }
}
