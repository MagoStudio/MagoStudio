import type {
  LocalModelGroupId,
  LocalModelGroupInstallState
} from "./localModelGroups";
import type { TextModelRequest, TextModelResponse } from "./textModelRequest";
/**
 * Whether this window talks to cloud Mago at all.
 *
 * "unchosen" is the first-launch state: the sign-in gate is shown and no
 * network request is made until the user picks. Chosen once, the value is
 * persisted and baked into the window at creation, so identity never changes
 * shape mid-session.
 */
export type MagoAppMode = "cloud" | "offline" | "unchosen";

export interface LibraryInfo {
  rootPath: string;
  databasePath: string;
  schemaVersion: number;
}

export interface LibraryIssue {
  id: string;
  kind: "service" | "project" | "asset";
  message: string;
  projectId?: string;
  assetId?: string;
}

export interface LocalProjectListItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_renders: number;
  total_img2img: number;
  timeline_count: number;
  preview_url: string | null;
  origin?: "local" | "cloud";
  type?: "timeline" | "script_to_shots";
}

export interface LocalVideoImport {
  sourcePath: string;
  name: string;
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  frameCount: number;
  thumbnailDataUrl: string;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
}

export interface LocalVideoImportResult {
  assetId: string;
  shotId: string;
}

export interface LocalImageImport {
  projectId: string;
  sourcePath: string;
  name: string;
  width: number;
  height: number;
  thumbnailDataUrl: string;
}

export const LOCAL_IMAGE_MODEL_NAMES = [
  "gpt_image_2",
  "seedream_5_pro",
  "qwen",
  "nanobanana_pro",
  "nanobanana_2"
] as const;

export type LocalImageModelName = (typeof LOCAL_IMAGE_MODEL_NAMES)[number];

export const LOCAL_VIDEO_MODEL_NAMES = [
  "seedance_2",
  "happy_horse_1",
  "wan_animate_2_2",
  "wan_vace_2_1",
  "mago_style_transfer_local",
  "mago_animate",
  "ltx_2_3_spatial_upscaler",
  "minimax_h3_local",
  "kling_o1",
  "kling_o3_edit_pro",
  "kling_2_6_motion_control",
  "kling_3_motion_control",
  "seedance_2_i2v",
  "seedance_2_i2v_fast"
] as const;

export type LocalVideoModelName = (typeof LOCAL_VIDEO_MODEL_NAMES)[number];

export interface LocalImageRenderInput {
  projectId: string;
  shotId: string;
  sourceAssetId: string;
  frame: number;
  name: string;
  model: LocalImageModelName;
  inputImage?: string;
  inputImageId?: string;
  referenceImageIds: string[];
  maskImageIds?: string[];
  estimatedCostUsd?: number;
  settings: Record<string, unknown>;
}

export const LOCAL_VLM_BACKENDS = [
  "qwen3-vl-2b-gguf",
  "qwen3-vl-4b-heretic-int8"
] as const;

export type LocalVlmBackend = (typeof LOCAL_VLM_BACKENDS)[number];

export const LOCAL_SCRIPT_TEXT_MODELS = [
  "qwen38-27b-q5",
  "qwen38-27b-q3"
] as const;

export type LocalScriptTextModel = (typeof LOCAL_SCRIPT_TEXT_MODELS)[number];

/**
 * Where text-LLM calls run: the local Qwen3.8 script text model, or Gemini
 * through Mago cloud. "cloud" only takes effect while signed in to Mago cloud
 * (see `resolveTextModelRoute`). Image captions are not covered — the backend
 * has no caption endpoint, so they always run on the local VLM.
 */
export const LOCAL_TEXT_MODEL_PROVIDERS = ["local", "cloud"] as const;

export type LocalTextModelProvider =
  (typeof LOCAL_TEXT_MODEL_PROVIDERS)[number];

export interface ComfySettings {
  endpoint: string;
  vlmBackend: LocalVlmBackend;
  scriptTextModel: LocalScriptTextModel;
  textModelProvider: LocalTextModelProvider;
}

export type ComfyLaunchedProcess =
  | { status: "running" }
  | {
      status: "exited";
      exitCode: number | null;
      reportedFailureReason: string | null;
    };

export interface ComfyStatus extends ComfySettings {
  canLaunch?: boolean;
  launchPath?: string | null;
  launchedProcess?: ComfyLaunchedProcess | null;
  configured: boolean;
  available: boolean;
  message: string | null;
}

export interface SbsVideoExportInput {
  requestId: string;
  inputAssetId: string;
  renderAssetId: string;
  startFrame: number;
  endFrame: number;
  fps: number;
  suggestedName: string;
}

export interface SbsVideoExportProgress {
  requestId: string;
  percentage: number;
}

/** Whether the selected local Qwen3-VL captioning path can run. */
export interface VlmModelStatus {
  /** The configured local model path this status describes. */
  backend: LocalVlmBackend;
  /** The required core/custom nodes and selected model files were found. */
  ready: boolean;
  /** Basenames the user still has to place in the selected backend's ComfyUI
   *  model folder. Empty when the problem is something else. */
  missingModels: string[];
  /** What to do about it, when not ready. */
  message: string | null;
}

/** Installation readiness for a model that runs through the user's ComfyUI. */
export interface ScriptSetupRequirement {
  installKind?: "core" | "node" | "model";
  downloadUrl?: string;
  downloadSha256?: string;
  archiveStripRoot?: boolean;
  pinnedRevision?: string;
  installNote?: string;
  name: string;
  url: string;
  folder?: string;
  status: "installed" | "missing" | "unknown";
}

export type OptionalScriptSetupId =
  | "qwen-image-sheet"
  | "vlm-captioning"
  | "script-text"
  | "flux-klein-4b-sheet"
  | "flux-klein-9b-sheet";

export interface ScriptSetupStatus {
  comfyRoot?: string;
  ready: boolean;
  nodes: ScriptSetupRequirement[];
  models: ScriptSetupRequirement[];
  highQuality: ScriptSetupRequirement[];
  vfxLoras: ScriptSetupRequirement[];
  optional: {
    id: OptionalScriptSetupId;
    title: string;
    requirements: ScriptSetupRequirement[];
  }[];
}

export interface ComfyModelStatus {
  model: LocalImageModelName | LocalVideoModelName;
  /** The selected model's required nodes and weight files were found. */
  ready: boolean;
  missingNodes: string[];
  missingModels: string[];
  message: string | null;
}

/** Same shape as the cloud `GET /assets/<id>/prompt` response. */
export interface LocalAssetPrompt {
  positive: {
    content: string;
    setting: string;
    style: string;
    references: string;
  };
  negative: string;
}

export interface LocalAssetPromptResult {
  prompt: LocalAssetPrompt | null;
}

export const LOCAL_AUTO_PROMPT_VERSIONS = [
  "img2img_mago",
  "video2video_default"
] as const;

export type LocalAutoPromptVersion =
  (typeof LOCAL_AUTO_PROMPT_VERSIONS)[number];

export interface LocalAutoPromptInput {
  version: LocalAutoPromptVersion;
  /** Data URI or bare base64, as the renderer already produces. */
  styleReferenceImage: string;
  /** Required for img2img_mago. */
  sourceVideoFrame?: string;
  /** Required for video2video_default. */
  motionDescription?: string;
}

export interface LocalAutoPromptResult {
  positive_prompt: string;
}

export interface LocalAutoPromptSaveInput {
  assetId: string;
  videoAssetId: string;
  version: LocalAutoPromptVersion;
  positivePrompt: string;
}

export interface LocalEnhancePromptInput {
  query: string;
  version?: string;
}

export interface LocalEnhancePromptResult {
  enhanced_prompt: string;
}

/** Same shape as the cloud `POST /adapt_i2v_prompt` body; asset ids are local. */
export interface LocalAdaptI2vPromptInput {
  prompt: string;
  reference_asset_ids?: string[];
  engine?: string;
  duration_s?: number;
  aspect?: string;
}

/** Same shape as the cloud `POST /adapt_i2v_prompt` response. */
export interface LocalAdaptI2vPromptResult {
  adapted_prompt: string;
  adapted: boolean;
  engine?: string;
  label_warnings?: string[];
  reference_inventory?: string;
}

export interface LocalVideoRenderInput {
  outputTrackId: string;
  inputTrackId?: string;
  frameRange: [number, number];
  fps: number;
  model: LocalVideoModelName;
  referenceImageIds: string[];
  estimatedCostUsd: number;
  settings: Record<string, unknown>;
}

export interface LocalTrackCreateInput {
  shotId: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  parentTrackOrder: number;
}

export interface LocalTrackUpdateInput {
  trackId: string;
  name: string;
  data: Record<string, unknown>;
  rating?: number;
}

export interface LocalShotCreateInput {
  projectId: string;
  name: string;
}

export interface LocalShotUpdateInput {
  shotId: string;
  name: string;
  settings: Record<string, unknown>;
}

export interface LocalAssetUpdateInput {
  assetId: string;
  rate: number;
}

export type LocalProjectStats = Record<string, unknown> & {
  total: Record<string, unknown>;
};

export type LocalQueueItem = Record<string, unknown> & {
  id: string;
  status: string;
};

export type LocalProject = Record<string, unknown> & {
  id: string;
  name: string;
  origin?: "local" | "cloud";
};

export interface LocalCloudProjectMirrorInput {
  project: Record<string, unknown>;
  includeContent?: boolean;
}

export interface LocalCloudAssetCacheInput {
  projectId: string;
  assetId: string;
  isImage: boolean;
  sourceUrl?: string;
  thumbnailUrl?: string;
}

export interface LocalScriptProjectSnapshot {
  state: Record<string, unknown> | null;
  scriptVersions: Record<string, unknown> | null;
  planDetails: Record<string, Record<string, unknown>> | null;
  cut: Record<string, unknown> | null;
}

export interface LocalScriptProjectSnapshotInput {
  projectId: string;
  metadataOnly?: boolean;
  project?: Record<string, unknown>;
  state?: Record<string, unknown>;
  scriptVersions?: Record<string, unknown>;
  planDetails?: Record<string, Record<string, unknown>>;
  cut?: Record<string, unknown>;
}

/** The cloud `POST /projects/:id/script` options. */
export interface LocalScriptCastInput {
  projectId: string;
  script: string;
  maxShots?: number;
  /** Default true, as on the cloud. */
  isAtomicShotsRequested?: boolean;
  /** Pack beats into render sequences; defaults to the atomic choice. */
  isRenderSequencesRequested?: boolean;
  /** The engine to pack for: "v9.1.0" (default) or "minimax_h3_max". */
  engine?: string | null;
  isCharacterDesignVersionsRequested?: boolean;
  isSeparateStyleRequested?: boolean;
  isSeparateCameraRequested?: boolean;
  /** Pack toward this script length in seconds (cloud `target_duration_s`). */
  targetDurationS?: number | null;
}

export interface LocalScriptSheetsInput {
  projectId: string;
  isDryRun: boolean;
  outputSize?: [number, number];
  settings?: Record<string, unknown>;
  tokens?: string[];
  /** Saved on the one key in `tokens`, which then renders from them (null clears). */
  referenceAssetIds?: string[] | null;
  referenceInstruction?: string | null;
  sheetGroupToCreate?: LocalSheetGroupToCreate;
}

export interface LocalSheetGroupToCreate {
  name?: string;
  kind?: string | null;
}

/** The local script project that owns a media id, from `scriptProjects.findMedia`. */
export interface LocalScriptProjectMedia {
  projectId: string;
  kind: "sheet-image" | "shot-version";
  /** The sheet image entry, render_settings included; null for a shot version. */
  image: Record<string, unknown> | null;
}

export interface LocalScriptShotsInput {
  projectId: string;
  isDryRun: boolean;
  outputSize?: [number, number];
  videoSettings?: Record<string, unknown>;
  sequenceIds?: number[];
  timelineIds?: string[];
  sequential?: {
    default?: LocalSequentialShotConfig;
    shots?: Record<string, Partial<LocalSequentialShotConfig>>;
  };
}

export interface LocalSequentialShotConfig {
  enabled: boolean;
  mode: "last_frame" | "key_frames" | "last_chunk";
  num_select?: number | null;
  chunk_seconds?: number | null;
  prompt_appendix?: string | null;
}

export interface LocalScriptCutExportInput {
  projectId: string;
  isDryRun: boolean;
}

export type LocalAsset = Record<string, unknown> & {
  id: string;
  name: string;
  filepath: string;
  data: Record<string, unknown>;
};

export type CloudLinkKind = "project" | "timeline" | "asset";

export interface CloudLink {
  kind: CloudLinkKind;
  localId: string;
  cloudId: string;
  syncedAt: string | Date | null;
  data: Record<string, unknown>;
}

/** The cloud `POST /chat/message` body, for a local script project. */
export interface LocalScriptChatMessageInput {
  projectId: string;
  message: string;
  systemPrompt?: string;
  /** Gemini-style tools: `{function_declarations: [...]}` containers. */
  tools?: unknown[];
  historyMessages?: number;
}

/** The cloud 202 body. */
export interface LocalScriptChatMessageAccepted {
  message_id: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  created_at: string;
}

/** The cloud `GET /chat/message` body. */
export interface LocalScriptChatMessages {
  project_id: string;
  pending: boolean;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    status: "PENDING" | "COMPLETED" | "FAILED";
    content: string;
    error: string | null;
    function_call: unknown;
    function_calls: unknown;
    created_at: string;
  }>;
}

export type LocalSetupHardwareVerdict = "ready" | "limited" | "blocked";

export interface LocalSetupHardwareReport {
  graphicsCards?: {
    name: string;
    videoMemoryLabel: string;
    selected: boolean;
  }[];
  skippedSharedGpuCount?: number;
  graphicsCardName: string;
  videoMemoryBytes?: number | null;
  videoMemoryLabel: string;
  systemMemoryLabel: string;
  verdict: LocalSetupHardwareVerdict;
}

export interface StarterInstallFile {
  name: string;
  url: string;
  destination: string;
  bytes: number;
  downloadedBytes: number;
  state: "waiting" | "downloading" | "verifying" | "done" | "error";
}
export interface StarterInstallStatus {
  hasCompletedInstall?: boolean;
  isComfyRestartNeeded?: boolean;
  phase:
    | "idle"
    | "downloading"
    | "verifying"
    | "extracting"
    | "installing-dependencies"
    | "paused"
    | "error"
    | "done";
  files: StarterInstallFile[];
  directory: string | null;
  error: string | null;
}
export type NodePackDependenciesOutcome =
  | { outcome: "installed" | "no-requirements" }
  | { outcome: "manual"; pipCommand: string; failureReason?: string };

export type SetupRequirementDownloadResult =
  | {
      outcome: "saved";
      savedTo: string;
      nodePackDependencies?: NodePackDependenciesOutcome;
    }
  | {
      outcome: "node-pack-update-needs-confirmation";
      customNodesFolder: string;
      nodePackDirectory: string;
      backupsFolder: string;
    };

export type ComfyRestartMethod =
  | "mago-launched-process"
  | "comfyui-manager"
  | "relaunch-from-install-folder";

export interface ComfyRestartStatus {
  restartMethod: ComfyRestartMethod | null;
  runningOrQueuedRenderCount: number | null;
}

export interface StarterInstallRequest {
  modelGroupIds: LocalModelGroupId[];
}

export interface LocalModelGroupStatus {
  groupId: LocalModelGroupId;
  state: LocalModelGroupInstallState;
  missingBytes: number;
}

export interface LocalModelGroupsStatus {
  isGetStartedInstall: boolean;
  installRootFreeBytes: number | null;
  groups: LocalModelGroupStatus[];
}

export interface LocalSetupStorageDrive {
  id: string;
  name: string;
  rootPath: string;
  freeGigabytes: number | null;
}

export interface LocalSetupFolderChoice {
  folderPath: string;
  freeGigabytes: number | null;
}

export interface MagoDesktopApi {
  textModel: {
    onRequest: (listener: (request: TextModelRequest) => void) => () => void;
    onCancel: (listener: (id: string) => void) => () => void;
    respond: (response: TextModelResponse) => void;
    ready: () => void;
  };
  app: {
    version: () => Promise<string>;
  };
  account: {
    /** Resolved before the renderer boots, so it can be read synchronously. */
    mode: MagoAppMode;
    /** Persists the choice and rebuilds the window with the new mode. */
    chooseMode: (mode: Exclude<MagoAppMode, "unchosen">) => Promise<void>;
    /** Drops the stored choice and rebuilds so the sign-in gate shows again. */
    signOut: () => Promise<void>;
    /** Subscribes to `mago://` links. Returns an unsubscribe function. */
    onDeepLink: (
      listener: (link: {
        action: string;
        params: Record<string, string>;
      }) => void
    ) => () => void;
  };
  localSetup: {
    installerStatus: () => Promise<StarterInstallStatus>;
    startInstaller: (
      request?: StarterInstallRequest
    ) => Promise<StarterInstallStatus>;
    modelGroupsStatus: () => Promise<LocalModelGroupsStatus>;
    pauseInstaller: () => Promise<void>;
    listDrives: () => Promise<LocalSetupStorageDrive[]>;
    selectStorageFolder: (
      folderPath: string
    ) => Promise<LocalSetupFolderChoice>;
    pauseDownload: (name: string) => Promise<void>;
    downloadRequirement: (
      name: string,
      options?: { replaceExistingNodePackIn?: string }
    ) => Promise<SetupRequirementDownloadResult | null>;
    downloadRequirements: (
      batchName: string,
      names: string[]
    ) => Promise<string | null>;
    /** Reads the real graphics card, video memory and system memory. */
    probeHardware: () => Promise<LocalSetupHardwareReport>;
    /** Opens a folder picker for the engine install location. Null when cancelled. */
    chooseFolder: () => Promise<LocalSetupFolderChoice | null>;
    acceptedModelLicenseRepos: () => Promise<string[]>;
    acceptModelLicenses: (huggingFaceRepos: string[]) => Promise<void>;
  };
  library: {
    get: () => Promise<LibraryInfo | null>;
    choose: () => Promise<LibraryInfo | null>;
    reveal: () => Promise<void>;
    issues: () => Promise<LibraryIssue[]>;
    openLogs: () => Promise<void>;
    restoreBackup: () => Promise<void>;
  };
  files: {
    getPath: (file: File) => string;
    saveAssetAs: (input: {
      assetId: string;
      suggestedName: string;
    }) => Promise<boolean>;
    exportSbsVideo: (input: SbsVideoExportInput) => Promise<boolean>;
    saveCloudStorageObjectAs: (input: {
      url: string;
      suggestedName: string;
    }) => Promise<boolean>;
    onSbsExportProgress: (
      listener: (event: SbsVideoExportProgress) => void
    ) => () => void;
  };
  assets: {
    get: (assetId: string) => Promise<LocalAsset | null>;
    importImage: (input: LocalImageImport) => Promise<LocalAsset>;
    update: (input: LocalAssetUpdateInput) => Promise<LocalAsset | null>;
    extractVideoFrame: (input: {
      assetId: string;
      frameNumber: number;
      fps: number;
    }) => Promise<string>;
    generateVideoFilmstrip: (input: {
      assetId: string;
      width: number;
      frameHeight: number;
    }) => Promise<string>;
  };
  cloud: {
    /** Local-to-cloud id mapping. The cloud copy is derived and disposable. */
    links: {
      get: (kind: CloudLinkKind, localId: string) => Promise<CloudLink | null>;
      put: (input: {
        kind: CloudLinkKind;
        localId: string;
        cloudId: string;
        data?: Record<string, unknown>;
      }) => Promise<void>;
      patch: (input: {
        kind: CloudLinkKind;
        localId: string;
        patch: Record<string, unknown>;
      }) => Promise<void>;
    };
    /**
     * Encodes the asset into the shape cloud ingestion can stream-copy, caching
     * the result. The renderer identifies the asset by id and never sees a path.
     */
    prepareUpload: (input: {
      assetId: string;
      trimStartSeconds?: number;
      trimEndSeconds?: number;
      force?: boolean;
    }) => Promise<{ sizeBytes: number; encoded: boolean }>;
    /** Streams the prepared file to a presigned URL obtained by the renderer. */
    uploadPrepared: (input: {
      assetId: string;
      trimStartSeconds?: number;
      trimEndSeconds?: number;
      presignedUrl: string;
    }) => Promise<void>;
    onUploadProgress: (
      listener: (event: { assetId: string; fraction: number }) => void
    ) => () => void;
    /** Metadata the cloud needs to register a local asset. */
    assetInfo: (assetId: string) => Promise<{
      id: string;
      name: string;
      extension: string;
      width: number | null;
      height: number | null;
      type: string;
      frameCount: number | null;
    } | null>;
    /**
     * Streams a local asset's own file to a presigned URL, unchanged. Used for
     * reference images, which need no re-encode.
     */
    uploadAsset: (input: {
      assetId: string;
      presignedUrl: string;
    }) => Promise<void>;
    /**
     * PUTs bytes the renderer holds (a freshly picked or trimmed video) to a
     * presigned URL. S3 rejects the renderer's own origin under CORS, so the
     * request is made from the main process. Progress arrives on
     * `onUploadProgress` keyed by `uploadId`.
     */
    uploadBytes: (input: {
      uploadId: string;
      presignedUrl: string;
      contentType: string;
      bytes: ArrayBuffer;
    }) => Promise<void>;
    cancelUploadBytes: (uploadId: string) => Promise<void>;
    renders: {
      /**
       * Creates the local PENDING rows for a render that runs in the cloud, so
       * the editor shows it immediately. The renderer has already submitted to
       * cloud Mago and passes the cloud ids in.
       */
      register: (input: {
        outputTrackId: string;
        sourceAssetId: string;
        model: string;
        frameRange: [number, number];
        fps: number;
        cloudAssetId: string;
        cloudClipId?: string | null;
        cloudOutputLayerId?: string | null;
        settings: Record<string, unknown>;
        sources?: Record<string, unknown>;
        width?: number;
        height?: number;
      }) => Promise<{ jobId: string; assetId: string; clipId: string }>;
      /**
       * The img2img counterpart. The cloud backend creates its own output
       * layer for an img2img render, so there is no track id to pass in --
       * generated stills share one IMG2IMG track per shot, found or created
       * here just as the local image path does.
       */
      registerImage: (input: {
        projectId: string;
        shotId: string;
        sourceAssetId: string;
        model: string;
        frame: number;
        name: string;
        cloudAssetId: string;
        /**
         * img2img has no project-wide queue the way video does -- status
         * comes from `GET /assets/img2img/status/{clipId}`, keyed by this.
         */
        cloudClipId: string;
        settings: Record<string, unknown>;
      }) => Promise<{ jobId: string; assetId: string; clipId: string }>;
      /** Jobs still worth polling, including after a restart. */
      listActive: () => Promise<
        {
          id: string;
          cloudAssetId: string | null;
          cloudClipId: string | null;
          /** Which poller applies: the project queue, or the per-clip status endpoint. */
          kind: "video" | "img2img";
          projectId: string;
          shotId: string;
          model: string;
          status: string;
          progress: number;
          /** Local ids, which the queue UI matches a track on. */
          assetId: string;
          trackId: string;
          clipId: string;
        }[]
      >;
      /** All locally tracked cloud jobs, including completed Queue history. */
      listQueue: () => Promise<LocalQueueItem[]>;
      /** Downloads the finished output and makes it an ordinary local asset. */
      finish: (input: { jobId: string; url: string }) => Promise<void>;
      fail: (input: { jobId: string; message: string }) => Promise<void>;
      setStatus: (input: {
        jobId: string;
        status: string;
        progress?: number;
      }) => Promise<void>;
    };
  };
  imageRenders: {
    submit: (input: LocalImageRenderInput) => Promise<{ jobId: string }>;
    listQueue: () => Promise<LocalQueueItem[]>;
    cancel: (jobId: string) => Promise<void>;
    markInteracted: (jobId: string) => Promise<void>;
  };
  comfy: {
    launch: (options?: {
      restartUnresponsiveProcess?: boolean;
    }) => Promise<void>;
    restartStatus: () => Promise<ComfyRestartStatus>;
    restart: () => Promise<void>;
    scriptSetupStatus: (options?: {
      debugMissing?: boolean;
      endpoint?: string;
      scriptTextModel?: LocalScriptTextModel;
      vlmBackend?: LocalVlmBackend;
    }) => Promise<ScriptSetupStatus>;
    get: () => Promise<ComfySettings>;
    save: (
      settings: ComfySettings,
      options?: { completeSetupOnConnection?: boolean }
    ) => Promise<ComfyStatus>;
    check: (endpoint?: string) => Promise<ComfyStatus>;
    modelStatus: (input: {
      model: string;
      settings?: Record<string, unknown>;
    }) => Promise<ComfyModelStatus>;
  };
  vlm: {
    status: () => Promise<VlmModelStatus>;
    /** Return the asset's caption, generating and persisting it if absent. */
    captionAsset: (assetId: string) => Promise<LocalAssetPromptResult>;
    autoPrompt: (input: LocalAutoPromptInput) => Promise<LocalAutoPromptResult>;
    saveAutoPrompt: (
      input: LocalAutoPromptSaveInput
    ) => Promise<LocalAsset | null>;
    enhancePrompt: (
      input: LocalEnhancePromptInput
    ) => Promise<LocalEnhancePromptResult>;
    /** MiniMax reference-prompt adaptation on the local script text model. */
    adaptI2vPrompt: (
      input: LocalAdaptI2vPromptInput
    ) => Promise<LocalAdaptI2vPromptResult>;
  };
  videoRenders: {
    submit: (input: LocalVideoRenderInput) => Promise<{ jobId: string }>;
  };
  tracks: {
    create: (input: LocalTrackCreateInput) => Promise<Record<string, unknown>>;
    update: (input: LocalTrackUpdateInput) => Promise<Record<string, unknown>>;
    delete: (trackId: string) => Promise<void>;
  };
  shots: {
    create: (input: LocalShotCreateInput) => Promise<Record<string, unknown>>;
    update: (input: LocalShotUpdateInput) => Promise<Record<string, unknown>>;
    delete: (shotId: string) => Promise<void>;
  };
  projects: {
    list: () => Promise<LocalProjectListItem[]>;
    listAll: () => Promise<LocalProject[]>;
    get: (projectId: string) => Promise<LocalProject | null>;
    /** Pulls a genuine cloud-owned project into the local read model. Returns
     * false for the hidden cloud copy of a locally-owned project. */
    mirrorCloud: (input: LocalCloudProjectMirrorInput) => Promise<boolean>;
    /** Interrupts background media hydration for an opened cloud project.
     * Metadata and every asset completed before cancellation remain durable. */
    cancelCloudMirror: (projectId: string) => Promise<void>;
    cancelCloudAsset: (projectId: string, assetId: string) => Promise<void>;
    /** Downloads one cloud asset into the library and marks it available.
     * Resolves true once the source file is on disk. */
    cacheCloudAsset: (input: LocalCloudAssetCacheInput) => Promise<boolean>;
    create: (input: {
      name: string;
      description: string;
      settings: Record<string, unknown>;
    }) => Promise<LocalProject>;
    update: (input: {
      projectId: string;
      name: string;
      description: string;
      settings: Record<string, unknown>;
    }) => Promise<LocalProject>;
    delete: (projectId: string) => Promise<void>;
    importVideos: (input: {
      projectId: string;
      videos: LocalVideoImport[];
    }) => Promise<LocalVideoImportResult[]>;
    listShots: (projectId: string) => Promise<LocalProjectListItem[]>;
    stats: (projectId: string) => Promise<LocalProjectStats>;
  };
  scriptProjects: {
    /** The local `POST /chat/message`: accept a turn, reply in the background. */
    chatMessage: (
      input: LocalScriptChatMessageInput
    ) => Promise<LocalScriptChatMessageAccepted>;
    /** The local `GET /chat/message`: the transcript, oldest first. */
    chatMessages: (input: {
      projectId: string;
      limit?: number;
    }) => Promise<LocalScriptChatMessages>;
    /** The local project owning an asset or sheet clip, or null for a cloud id. */
    findMedia: (query: {
      assetId?: string;
      clipId?: string;
    }) => Promise<LocalScriptProjectMedia | null>;
    getRenderMetrics: (assetId: string) => Promise<Record<string, unknown>>;
    put: (input: LocalScriptProjectSnapshotInput) => Promise<void>;
    cacheMedia: (projectId: string, sourceUrl: string) => Promise<void>;
    cancelMedia: (projectId: string, sourceUrl: string) => Promise<void>;
    get: (projectId: string) => Promise<LocalScriptProjectSnapshot | null>;
    getPlan: (planId: string) => Promise<Record<string, unknown> | null>;
    cancelPlan: (planId: string) => Promise<Record<string, unknown>>;
    resumePlan: (planId: string) => Promise<Record<string, unknown>>;
    cast: (input: LocalScriptCastInput) => Promise<{
      version: number;
      plan_id: string;
    }>;
    generateSheets: (
      input: LocalScriptSheetsInput
    ) => Promise<Record<string, unknown>>;
    generateShots: (
      input: LocalScriptShotsInput
    ) => Promise<Record<string, unknown>>;
    exportCut: (
      input: LocalScriptCutExportInput
    ) => Promise<Record<string, unknown>>;
    update: (input: {
      projectId: string;
      operation:
        | "edit-sheet"
        | "add-sheet-image"
        | "describe-sheet"
        | "pin-sheet"
        | "add-shot"
        | "edit-shot"
        | "pin-shot"
        | "edit-image-description"
        | "start-cloud-sheet-render"
        | "add-cloud-sheet-render"
        | "fail-cloud-sheet-render"
        | "storyboard"
        | "storyboard-generate"
        | "storyboard-update";
      payload: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;
  };
}

export const IPC_CHANNELS = {
  textModelRequest: "text-model:request",
  textModelResponse: "text-model:response",
  textModelReady: "text-model:ready",
  textModelCancel: "text-model:cancel",
  appVersion: "app:version",
  accountChooseMode: "account:choose-mode",
  accountSignOut: "account:sign-out",
  accountDeepLink: "account:deep-link",
  cloudLinkGet: "cloud:link-get",
  cloudLinkPut: "cloud:link-put",
  cloudLinkPatch: "cloud:link-patch",
  cloudPrepareUpload: "cloud:prepare-upload",
  cloudUploadPrepared: "cloud:upload-prepared",
  cloudUploadProgress: "cloud:upload-progress",
  cloudAssetInfo: "cloud:asset-info",
  cloudUploadAsset: "cloud:upload-asset",
  cloudUploadBytes: "cloud:upload-bytes",
  cloudCancelUploadBytes: "cloud:cancel-upload-bytes",
  cloudRenderRegister: "cloud:render-register",
  cloudImageRenderRegister: "cloud:image-render-register",
  cloudRenderListActive: "cloud:render-list-active",
  cloudRenderListQueue: "cloud:render-list-queue",
  cloudRenderFinish: "cloud:render-finish",
  cloudRenderFail: "cloud:render-fail",
  cloudRenderSetStatus: "cloud:render-set-status",
  localSetupPauseDownload: "local-setup:pause-download",
  localSetupDownloadRequirement: "local-setup:download-requirement",
  localSetupDownloadRequirements: "local-setup:download-requirements",
  localSetupProbeHardware: "local-setup:probe-hardware",
  localSetupInstallerStatus: "local-setup:installer-status",
  localSetupInstallerStart: "local-setup:installer-start",
  localSetupInstallerPause: "local-setup:installer-pause",
  localSetupListDrives: "local-setup:list-drives",
  localSetupSelectStorageFolder: "local-setup:select-storage-folder",
  localSetupChooseFolder: "local-setup:choose-folder",
  localSetupAcceptedModelLicenseRepos:
    "local-setup:accepted-model-license-repos",
  localSetupAcceptModelLicenses: "local-setup:accept-model-licenses",
  localSetupModelGroupsStatus: "local-setup:model-groups-status",
  libraryGet: "library:get",
  libraryChoose: "library:choose",
  libraryReveal: "library:reveal",
  libraryIssues: "library:issues",
  libraryOpenLogs: "library:open-logs",
  libraryRestoreBackup: "library:restore-backup",
  filesSaveAssetAs: "files:save-asset-as",
  filesExportSbsVideo: "files:export-sbs-video",
  filesSbsExportProgress: "files:sbs-export-progress",
  filesSaveCloudStorageObjectAs: "files:save-cloud-storage-object-as",
  projectsList: "projects:list",
  projectsListAll: "projects:list-all",
  projectsGet: "projects:get",
  projectsMirrorCloud: "projects:mirror-cloud",
  projectsCancelCloudMirror: "projects:cancel-cloud-mirror",
  projectsCancelCloudAsset: "projects:cancel-cloud-asset",
  projectsCacheCloudAsset: "projects:cache-cloud-asset",
  projectsCreate: "projects:create",
  projectsUpdate: "projects:update",
  projectsDelete: "projects:delete",
  projectsImportVideos: "projects:import-videos",
  projectsListShots: "projects:list-shots",
  projectsStats: "projects:stats",
  scriptProjectsPut: "script-projects:put",
  scriptProjectsCacheMedia: "script-projects:cache-media",
  scriptProjectsCancelMedia: "script-projects:cancel-media",
  scriptProjectsGet: "script-projects:get",
  scriptProjectsGetPlan: "script-projects:get-plan",
  scriptProjectsCancelPlan: "script-projects:cancel-plan",
  scriptProjectsResumePlan: "script-projects:resume-plan",
  scriptProjectsCast: "script-projects:cast",
  scriptProjectsChatMessage: "script-projects:chat-message",
  scriptProjectsChatMessages: "script-projects:chat-messages",
  scriptProjectsFindMedia: "script-projects:find-media",
  scriptProjectsGetRenderMetrics: "script-projects:get-render-metrics",
  scriptProjectsGenerateSheets: "script-projects:generate-sheets",
  scriptProjectsGenerateShots: "script-projects:generate-shots",
  scriptProjectsExportCut: "script-projects:export-cut",
  scriptProjectsUpdate: "script-projects:update",
  assetsGet: "assets:get",
  assetsImportImage: "assets:import-image",
  assetsUpdate: "assets:update",
  assetsExtractVideoFrame: "assets:extract-video-frame",
  assetsGenerateVideoFilmstrip: "assets:generate-video-filmstrip",
  imageRendersSubmit: "image-renders:submit",
  imageRendersListQueue: "image-renders:list-queue",
  imageRendersCancel: "image-renders:cancel",
  imageRendersMarkInteracted: "image-renders:mark-interacted",
  comfyGet: "comfy:get",
  comfyScriptSetupStatus: "comfy:script-setup-status",
  comfySave: "comfy:save",
  comfyCheck: "comfy:check",
  comfyLaunch: "comfy:launch",
  comfyRestartStatus: "comfy:restart-status",
  comfyRestart: "comfy:restart",
  comfyModelStatus: "comfy:model-status",
  vlmStatus: "vlm:status",
  vlmCaptionAsset: "vlm:caption-asset",
  vlmAutoPrompt: "vlm:auto-prompt",
  vlmSaveAutoPrompt: "vlm:save-auto-prompt",
  vlmEnhancePrompt: "vlm:enhance-prompt",
  vlmAdaptI2vPrompt: "vlm:adapt-i2v-prompt",
  videoRendersSubmit: "video-renders:submit",
  tracksCreate: "tracks:create",
  tracksUpdate: "tracks:update",
  tracksDelete: "tracks:delete",
  shotsCreate: "shots:create",
  shotsUpdate: "shots:update",
  shotsDelete: "shots:delete"
} as const;
