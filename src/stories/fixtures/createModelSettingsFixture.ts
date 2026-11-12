import { defaultModelPreferences } from "../../../desktop/shared/defaultModelPreferences";
import { LOCAL_MODEL_DEFINITIONS } from "../../../desktop/shared/localModelDefinitions";
import { LOCAL_MODEL_BUNDLES } from "../../../desktop/shared/localModelManifest";
import type {
  EndpointModelSettings,
  ModelFileCheckSummary,
  ModelOperationResult,
  ModelSettingsApi,
  ModelSettingsRequest,
  ModelSettingsSnapshot
} from "../../../desktop/shared/modelSettings";
import { resolveModelVariant } from "../../../desktop/shared/resolveModelVariant";

export type ModelSettingsFixtureOptions = {
  comfyVersion?: string;
  isRecommendedFileInstalled?: boolean;
  areCustomFileNodesMissing?: boolean;
};

export const createModelSettingsFixture = ({
  comfyVersion = "0.38.0",
  isRecommendedFileInstalled = true,
  areCustomFileNodesMissing = false
}: ModelSettingsFixtureOptions = {}) => {
  const settings: EndpointModelSettings = { models: {}, memoryPolicy: "auto" };
  const setupTextVariant = "qwen38-27b-q3";
  const latestFileCheckByFilename = new Map<string, ModelFileCheckSummary>([
    [
      "custom-main.gguf",
      {
        kind: "compatibility",
        outcome: "passed",
        checkedAt: "2026-11-10T14:32:00.000Z"
      }
    ]
  ]);
  const recordFileCheck = (
    filename: string | undefined,
    action: string,
    result: ModelOperationResult
  ) => {
    const isFileCheck =
      action === "compatibility" || action === "load" || action === "hash";
    if (!filename || !isFileCheck) return result;
    latestFileCheckByFilename.set(filename, {
      kind: action,
      outcome: result.status === "success" ? "passed" : "failed",
      checkedAt: new Date().toISOString()
    });
    return result;
  };
  const inspect = async ({
    model,
    endpoint = "http://127.0.0.1:8188"
  }: ModelSettingsRequest): Promise<ModelSettingsSnapshot> => {
    const definition = LOCAL_MODEL_DEFINITIONS.find(
      (definition) => definition.id === model
    )!;
    const preferences =
      settings.models[model] ??
      defaultModelPreferences(definition.defaultVariant);
    const variant = resolveModelVariant(
      definition,
      preferences,
      setupTextVariant
    );
    return {
      model,
      endpoint,
      settings: structuredClone(settings),
      setupTextVariant,
      variant: variant.id,
      available: true,
      comfyVersion,
      local: true,
      python: "D:/ComfyUI/python_embeded/python.exe",
      managed: true,
      capabilities: { encoderCpu: true, tiledDecode: true },
      loadersAvailable: true,
      missingWorkflowNodes: [],
      isLlamaCppPackageInstalled: definition.runtime === "llama" ? true : null,
      components: variant.components.map((component) => {
        const selectedFile =
          preferences.bindings[`${variant.id}:${component.role}`] ??
          component.filename;
        const manifestFiles = LOCAL_MODEL_BUNDLES.flatMap(
          (bundle) => bundle.files
        );
        const manifest = manifestFiles.find(
          (file) => file.targetPath.split("/").pop() === selectedFile
        );
        const recommendedManifestEntry = manifestFiles.find(
          (file) => file.targetPath.split("/").pop() === component.filename
        );
        const choiceFilenames = [
          ...new Set([
            ...(isRecommendedFileInstalled
              ? [component.filename, selectedFile]
              : []),
            `custom-${component.role}${component.filename.endsWith(".gguf") ? ".gguf" : ".safetensors"}`,
            "wrong-shape.gguf"
          ])
        ];
        return {
          ...component,
          selectedFile,
          choices: choiceFilenames.map((filename) => ({
            filename,
            path: `D:/ComfyUI/models/${component.category}/${filename}`,
            hasPassedModelCheck: filename.startsWith("custom-"),
            loadTestOutcome: "untested",
            latestFileCheck: latestFileCheckByFilename.get(filename) ?? null,
            sourceUrl:
              manifestFiles.find(
                (file) => file.targetPath.split("/").pop() === filename
              )?.url ?? null,
            expectedSha256:
              manifestFiles.find(
                (file) => file.targetPath.split("/").pop() === filename
              )?.sha256 ?? null,
            actualSha256: null,
            missingNodes:
              areCustomFileNodesMissing && filename.startsWith("custom-")
                ? [
                    {
                      name: "UnetLoaderGGUF",
                      url: "https://github.com/city96/ComfyUI-GGUF",
                      installKind: "node" as const,
                      status: "missing" as const,
                      downloadUrl:
                        "https://github.com/city96/ComfyUI-GGUF/archive/refs/heads/main.zip"
                    }
                  ]
                : []
          })),
          recommendedFile: {
            filename: component.filename,
            isInstalled: isRecommendedFileInstalled,
            setupDownloadName: recommendedManifestEntry
              ? component.filename
              : null,
            sourceUrl:
              recommendedManifestEntry?.url ?? component.downloadUrl ?? null
          },
          path: `D:/ComfyUI/models/${component.category}/${selectedFile}`,
          sourceUrl: manifest?.url ?? null,
          expectedSha256: manifest?.sha256 ?? null,
          actualSha256: null,
          status: isRecommendedFileInstalled ? "installed" : "missing",
          problem: null
        };
      })
    };
  };
  const api: ModelSettingsApi = {
    inspect,
    save: async (request) => {
      settings.models[request.model] = structuredClone(request.preferences);
      settings.memoryPolicy = request.memoryPolicy;
      return inspect(request);
    },
    check: async (request) =>
      recordFileCheck(
        request.filename,
        request.action,
        request.filename === "wrong-shape.gguf"
          ? {
              status: "mismatch",
              message:
                "Tensor shape mismatch against the recommended component",
              details: { action: request.action, comparedTensors: 0 }
            }
          : {
              status: "success",
              message:
                request.action === "runtime"
                  ? "Runtime probe completed"
                  : request.action === "repair"
                    ? "GPU runtime verified. Restart ComfyUI before loading models."
                    : "Component check passed",
              details: { fixture: true, action: request.action }
            }
      ),
    diagnostics: async (endpoint) => ({
      example: true,
      mago: { version: "0.19.3", commit: "fixture-commit", development: true },
      endpoint,
      hardware: {
        cpu: "Example CPU",
        ramTotalBytes: 68719476736,
        ramFreeBytes: 40000000000,
        graphics: "Example GPU",
        vramFreeBytes: 6442450944
      },
      comfy: { version: "0.3.75", lastSeenAt: "2026-11-10T14:31:00Z" },
      settings
    })
  };
  return { api, settings };
};
