import { createReadStream } from "node:fs";
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  rename,
  rm,
  stat,
  statfs
} from "node:fs/promises";
import path from "node:path";

import type {
  StarterInstallFile,
  StarterInstallRequest,
  StarterInstallStatus
} from "../../shared/contracts";
import {
  ALWAYS_INSTALLED_MODEL_GROUP_IDS,
  isLocalModelGroupId,
  type LocalModelGroupId
} from "../../shared/localModelGroups";
import {
  COMFY_STARTER_BUNDLE,
  starterEngineRequiredBytes
} from "../../shared/localModelManifest";
import type { LibrarySettings } from "../librarySettings";
import { atomicWriteFile } from "../storage/atomicFile";

import { confirmAndCopyInstallerModels } from "./confirmAndCopyInstallerModels";
import { extractNodePack } from "./extractNodePack";
import { extractStarterArchive } from "./extractStarterArchive";
import { hashFile } from "./hashFile";
import {
  inspectLocalModelGroups,
  isModelGroupItemOnDisk,
  type InspectedModelGroup
} from "./inspectLocalModelGroups";
import { inspectLocalModelGroupsForInstall } from "./inspectLocalModelGroupsForInstall";
import { installNodePackRequirements } from "./installNodePackRequirements";
import type { ModelGroupItem } from "./listModelGroupItems";
import { readVideoMemoryBytesOnce } from "./readVideoMemoryBytesOnce";
import { resolveNodePackBackupsFolder } from "./resolveNodePackBackupsFolder";
import { resolveStarterEnginePaths } from "./resolveStarterEnginePaths";
import { resumableDownload } from "./resumableDownload";
import { swapInNodePack } from "./swapInNodePack";

const NODE_PACK_ARCHIVE_SHA256_PREFIX_LENGTH = 12;

type StarterEnginePaths = ReturnType<typeof resolveStarterEnginePaths>;

type StarterInstallerDependencies = {
  confirmModelCopy: (bytes: number) => Promise<boolean>;
  showModelCopyError: () => Promise<void>;
  readVideoMemoryBytes: () => Promise<number | null>;
  installRequirements: typeof installNodePackRequirements;
};

type StarterInstallSettings = Pick<
  LibrarySettings,
  | "getLocalModelsRoot"
  | "getSelectedModelGroupVariants"
  | "setSelectedModelGroupVariant"
  | "getInstalledModelGroups"
  | "recordInstalledModelGroup"
  | "setVlmBackend"
  | "markLocalSetupCompleted"
  | "hasCompletedLocalSetup"
> &
  Partial<Pick<LibrarySettings, "getComfyEndpoint">>;

const isStarterEngineInstalled = async (
  paths: StarterEnginePaths
): Promise<boolean> => {
  try {
    return (
      JSON.parse(await readFile(paths.engineMarker, "utf8")).sha256 ===
        COMFY_STARTER_BUNDLE.sha256 &&
      Boolean(await stat(paths.embeddedPython)) &&
      Boolean(await stat(path.join(paths.comfyDirectory, "main.py")))
    );
  } catch {
    return false;
  }
};

const resolveRequestedModelGroupIds = (
  request: StarterInstallRequest | undefined,
  recordedModelGroupIds: string[]
): LocalModelGroupId[] => [
  ...new Set<LocalModelGroupId>([
    ...ALWAYS_INSTALLED_MODEL_GROUP_IDS,
    ...(request?.modelGroupIds ?? recordedModelGroupIds).filter(
      isLocalModelGroupId
    )
  ])
];

const installFileOf = (
  item: ModelGroupItem,
  paths: StarterEnginePaths
): Omit<StarterInstallFile, "downloadedBytes" | "state"> =>
  item.kind === "node-pack"
    ? {
        name: item.name,
        url: item.downloadUrl,
        bytes: 0,
        destination: path.join(
          paths.cache,
          "node-packs",
          `${item.name}-${item.sha256.slice(0, NODE_PACK_ARCHIVE_SHA256_PREFIX_LENGTH)}.zip`
        )
      }
    : {
        name: item.name,
        url: item.downloadUrl,
        bytes: item.bytes,
        destination: item.absolutePath
      };

export class StarterInstaller {
  private state: StarterInstallStatus = {
    phase: "idle",
    files: [],
    directory: null,
    error: null
  };
  private starting: Promise<StarterInstallStatus> | null = null;
  private controller: AbortController | null = null;
  private running: Promise<void> | null = null;
  private lastRequestedModelGroupIds: LocalModelGroupId[] = [];
  private readonly dependencies: StarterInstallerDependencies;
  constructor(
    private readonly settings: StarterInstallSettings,
    dependencies: Partial<StarterInstallerDependencies> = {}
  ) {
    this.dependencies = {
      confirmModelCopy: async () => false,
      showModelCopyError: async () => {},
      readVideoMemoryBytes: readVideoMemoryBytesOnce,
      installRequirements: installNodePackRequirements,
      ...dependencies
    };
  }
  status(): StarterInstallStatus {
    return structuredClone(this.state);
  }
  async pause(): Promise<void> {
    await this.starting;
    this.controller?.abort();
    await this.running;
  }
  start(request?: StarterInstallRequest): Promise<StarterInstallStatus> {
    if (this.starting) return this.starting;
    this.starting = this.startInternal(request).finally(() => {
      this.starting = null;
    });
    return this.starting;
  }
  private async startInternal(
    request: StarterInstallRequest | undefined
  ): Promise<StarterInstallStatus> {
    if (this.controller) return this.status();
    if (process.platform !== "win32")
      throw new Error(
        "The bundled ComfyUI installer currently supports Windows only. Use your own ComfyUI on this platform."
      );
    const selected = await this.settings.getLocalModelsRoot();
    if (!selected) throw new Error("Choose a storage location first.");
    const urls = COMFY_STARTER_BUNDLE.partUrls;
    if (
      urls.length !== COMFY_STARTER_BUNDLE.partBytes.length ||
      urls.some((url) => !url.startsWith("https://"))
    )
      throw new Error(
        "ComfyUI release asset URLs have not been configured yet."
      );
    const paths = resolveStarterEnginePaths(selected);
    const modelGroupIds = resolveRequestedModelGroupIds(
      request,
      Object.keys(await this.settings.getInstalledModelGroups())
    );
    const installInspection = await inspectLocalModelGroupsForInstall(
      this.settings,
      this.dependencies.readVideoMemoryBytes
    );
    const hardwareVariantGroupIdsToSave =
      installInspection.hardwareVariantGroupIdsPickedForInstall.filter(
        (groupId) => modelGroupIds.includes(groupId)
      );
    const groupsBeforeInstall = installInspection.groups;
    const needsEngine = !(await isStarterEngineInstalled(paths));
    const pendingItems = this.collectPendingItems(
      groupsBeforeInstall,
      modelGroupIds,
      needsEngine
    );
    const engineBytes = needsEngine ? starterEngineRequiredBytes() : 0;
    const requiredBytes =
      engineBytes +
      pendingItems.reduce(
        (total, item) => total + (item.kind === "model-file" ? item.bytes : 0),
        0
      );
    const isSameModelGroupsAsLastRun =
      modelGroupIds.length === this.lastRequestedModelGroupIds.length &&
      modelGroupIds.every((groupId) =>
        this.lastRequestedModelGroupIds.includes(groupId)
      );
    const isResumingInterruptedInstall =
      (this.state.phase === "paused" || this.state.phase === "error") &&
      isSameModelGroupsAsLastRun;
    const space = await statfs(selected);
    if (
      Number(space.bavail) * Number(space.bsize) < requiredBytes &&
      !isResumingInterruptedInstall
    )
      throw new Error(
        "Not enough free space for the selected models and ComfyUI extraction."
      );
    for (const groupId of hardwareVariantGroupIdsToSave) {
      const pickedVariantId =
        installInspection.selectedModelGroupVariantsForInstall[groupId];
      if (pickedVariantId)
        await this.settings.setSelectedModelGroupVariant(
          groupId,
          pickedVariantId
        );
    }
    const isFirstCompletedSetup =
      !(await this.settings.hasCompletedLocalSetup());
    this.lastRequestedModelGroupIds = modelGroupIds;
    await mkdir(paths.cache, { recursive: true });
    const engineFiles = needsEngine
      ? urls.map((url, index) => ({
          name:
            urls.length === 1
              ? "ComfyUI engine ZIP"
              : `ComfyUI bundle part ${index + 1}`,
          url,
          bytes: COMFY_STARTER_BUNDLE.partBytes[index],
          destination: path.join(
            paths.cache,
            urls.length === 1 ? "comfy.zip" : `comfy.zip.part${index + 1}`
          )
        }))
      : [];
    this.state = {
      phase: "downloading",
      files: [
        ...engineFiles,
        ...pendingItems.map((item) => installFileOf(item, paths))
      ].map((file) => ({
        ...file,
        downloadedBytes: 0,
        state: "waiting" as const
      })),
      directory: paths.engine,
      error: null
    };
    const controller = new AbortController();
    this.controller = controller;
    this.running = this.install(
      paths,
      modelGroupIds,
      needsEngine ? null : groupsBeforeInstall,
      isFirstCompletedSetup,
      controller.signal
    )
      .catch((error) => {
        this.state.phase = controller.signal.aborted ? "paused" : "error";
        this.state.error = controller.signal.aborted
          ? null
          : error instanceof Error
            ? error.message
            : "Installation failed";
        const current = this.state.files.find(
          (file) => file.state === "downloading" || file.state === "verifying"
        );
        if (current)
          current.state = controller.signal.aborted ? "waiting" : "error";
      })
      .finally(() => {
        this.controller = null;
      });
    return this.status();
  }
  private collectPendingItems(
    groups: InspectedModelGroup[],
    modelGroupIds: LocalModelGroupId[],
    needsEngine: boolean
  ): ModelGroupItem[] {
    const pendingByPath = new Map<string, ModelGroupItem>();
    for (const group of groups)
      if (modelGroupIds.includes(group.groupId))
        for (const item of group.missingItems)
          if (!(needsEngine && item.kind === "node-pack"))
            pendingByPath.set(item.absolutePath, item);
    return [...pendingByPath.values()];
  }
  private fileIndexFor(item: ModelGroupItem, paths: StarterEnginePaths) {
    const file = installFileOf(item, paths);
    const existingIndex = this.state.files.findIndex(
      (candidate) => candidate.destination === file.destination
    );
    if (existingIndex !== -1) return existingIndex;
    this.state.files.push({ ...file, downloadedBytes: 0, state: "waiting" });
    return this.state.files.length - 1;
  }
  private async install(
    paths: StarterEnginePaths,
    modelGroupIds: LocalModelGroupId[],
    groupsInspectedWithEngine: InspectedModelGroup[] | null,
    isFirstCompletedSetup: boolean,
    signal: AbortSignal
  ): Promise<void> {
    if (!groupsInspectedWithEngine) await this.installEngine(paths, signal);
    const groups =
      groupsInspectedWithEngine ??
      (await inspectLocalModelGroups(this.settings)).groups;
    const completedPaths = new Set<string>();
    const modelsToCopy: Extract<ModelGroupItem, { kind: "model-file" }>[] = [];
    let hasInstalledNodePack = false;
    for (const group of groups) {
      if (!modelGroupIds.includes(group.groupId)) continue;
      for (const item of group.missingItems) {
        if (completedPaths.has(item.absolutePath)) continue;
        const fileIndex = this.fileIndexFor(item, paths);
        if (item.kind === "node-pack") {
          await this.installNodePack(item, fileIndex, paths, signal);
          hasInstalledNodePack = true;
        } else {
          await this.download(fileIndex, signal, item.sha256);
          modelsToCopy.push(item);
        }
        completedPaths.add(item.absolutePath);
      }
      await this.settings.recordInstalledModelGroup(
        group.groupId,
        // Only files in the selected installation belong in its install record.
        // Some items may have been supplied by another running ComfyUI.
        (
          await Promise.all(
            group.items.map(async (item) => {
              return (await isModelGroupItemOnDisk(item)) ? item.sha256 : null;
            })
          )
        ).filter((hash): hash is string => hash !== null)
      );
    }
    if (this.settings.getComfyEndpoint && modelsToCopy.length > 0) {
      this.state.phase = "verifying";
      await confirmAndCopyInstallerModels({
        endpoint: await this.settings.getComfyEndpoint(),
        managedComfyDirectory: paths.comfyDirectory,
        items: modelsToCopy,
        signal,
        confirmCopy: this.dependencies.confirmModelCopy,
        showCopyError: this.dependencies.showModelCopyError
      });
    }
    for (const file of this.state.files)
      if (file.state === "waiting") {
        file.state = "done";
        file.downloadedBytes = file.bytes;
      }
    this.state.isComfyRestartNeeded = hasInstalledNodePack;
    if (isFirstCompletedSetup)
      await this.settings.setVlmBackend("qwen3-vl-4b-heretic-int8");
    await this.settings.markLocalSetupCompleted();
    this.state.phase = "done";
  }
  private async installEngine(
    paths: StarterEnginePaths,
    signal: AbortSignal
  ): Promise<void> {
    if (await stat(paths.engine).catch(() => null))
      throw new Error(
        "The engine folder already exists but was not installed by this wizard. Choose a different storage folder."
      );
    const engineFileCount = COMFY_STARTER_BUNDLE.partBytes.length;
    for (let index = 0; index < engineFileCount; index++)
      await this.download(index, signal);
    this.state.phase = "verifying";
    const archive = path.join(paths.cache, "comfy.zip");
    const archiveFiles = this.state.files.slice(0, engineFileCount);
    for (const file of archiveFiles) file.state = "verifying";
    if (COMFY_STARTER_BUNDLE.partUrls.length > 1) {
      const joined = await open(archive, "w");
      try {
        for (const file of archiveFiles) {
          for await (const chunk of createReadStream(file.destination)) {
            signal.throwIfAborted();
            let offset = 0;
            const buffer = Buffer.from(chunk);
            while (offset < buffer.length)
              offset += (await joined.write(buffer, offset)).bytesWritten;
          }
        }
      } finally {
        await joined.close();
      }
    }
    if ((await hashFile(archive, signal)) !== COMFY_STARTER_BUNDLE.sha256) {
      for (const file of archiveFiles) {
        file.state = "error";
        await rename(
          file.destination,
          file.destination + `.invalid-${Date.now()}`
        );
      }
      throw new Error(
        "ComfyUI bundle SHA-256 check failed. Retry to download the bundle again."
      );
    }
    this.state.phase = "extracting";
    for (const file of archiveFiles) file.state = "done";
    const staging = await mkdtemp(path.join(paths.cache, "extract-"));
    try {
      await extractStarterArchive(archive, staging, signal);
      signal.throwIfAborted();
      await stat(
        path.join(
          staging,
          "ComfyUI_windows_portable",
          "python_embeded",
          "python.exe"
        )
      );
      await rename(
        path.join(staging, "ComfyUI_windows_portable"),
        paths.engine
      );
      await atomicWriteFile(
        paths.engineMarker,
        JSON.stringify({ sha256: COMFY_STARTER_BUNDLE.sha256 })
      );
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  private async installNodePack(
    item: Extract<ModelGroupItem, { kind: "node-pack" }>,
    fileIndex: number,
    paths: StarterEnginePaths,
    signal: AbortSignal
  ): Promise<void> {
    signal.throwIfAborted();
    const file = this.state.files[fileIndex];
    await mkdir(path.dirname(file.destination), { recursive: true });
    file.state = "downloading";
    this.state.phase = "downloading";
    await resumableDownload(
      item.downloadUrl,
      file.destination,
      signal,
      (received) => {
        file.downloadedBytes = received;
      },
      item.sha256
    );
    file.state = "verifying";
    this.state.phase = "verifying";
    const stagedNodePack = path.join(
      paths.cache,
      "node-pack-staging",
      `${item.name}-${Date.now()}`
    );
    await mkdir(path.dirname(stagedNodePack), { recursive: true });
    try {
      await extractNodePack(
        file.destination,
        stagedNodePack,
        item.archiveStripRoot
      );
      this.state.phase = "installing-dependencies";
      await this.dependencies.installRequirements({
        python: paths.embeddedPython,
        nodePackDirectory: stagedNodePack,
        signal
      });
    } catch (error) {
      await rm(stagedNodePack, { recursive: true, force: true });
      throw error;
    }
    try {
      await swapInNodePack({
        stagedNodePack,
        nodePackDirectory: item.absolutePath,
        replacedNodePack: path.join(
          resolveNodePackBackupsFolder(paths.customNodesDirectory),
          `${item.name}-${Date.now()}`
        )
      });
    } finally {
      await rm(stagedNodePack, { recursive: true, force: true });
    }
    file.bytes = file.downloadedBytes;
    file.state = "done";
  }
  private async download(
    index: number,
    signal: AbortSignal,
    sha256?: string
  ): Promise<void> {
    signal.throwIfAborted();
    const file = this.state.files[index];
    await mkdir(path.dirname(file.destination), { recursive: true });
    const existing = await stat(file.destination).catch(() => null);
    if (existing) {
      file.state = "verifying";
      this.state.phase = "verifying";
      if (
        existing.size !== file.bytes ||
        (sha256 && (await hashFile(file.destination, signal)) !== sha256)
      ) {
        await rename(
          file.destination,
          file.destination + `.invalid-${Date.now()}`
        );
      } else {
        file.downloadedBytes = file.bytes;
        file.state = "done";
        return;
      }
    }
    file.state = "downloading";
    this.state.phase = "downloading";
    await resumableDownload(
      file.url,
      file.destination,
      signal,
      (received) => {
        file.downloadedBytes = received;
        if (received >= file.bytes) {
          file.state = "verifying";
          this.state.phase = "verifying";
        }
      },
      sha256
    );
    if ((await stat(file.destination)).size !== file.bytes)
      throw new Error(`Unexpected size for ${file.name}. Retry to repair.`);
    file.downloadedBytes = file.bytes;
    file.state = "done";
  }
}
