import { contextBridge, ipcRenderer, webUtils } from "electron";

import type { MagoDesktopApi } from "../shared/contracts";
import type { TextModelRequest } from "../shared/textModelRequest";

// A sandboxed preload cannot require application modules at runtime. Keep the
// channel values local while importing only the erased TypeScript contract.
const APP_MODE_FLAG = "--mago-app-mode=";

// additionalArguments, not IPC: the renderer must be able to pick its identity
// implementation at module load, before any hook runs.
const readAppMode = (): "cloud" | "offline" | "unchosen" => {
  const argument = process.argv.find((value) =>
    value.startsWith(APP_MODE_FLAG)
  );
  const mode = argument?.slice(APP_MODE_FLAG.length);
  return mode === "cloud" || mode === "offline" ? mode : "unchosen";
};

const ipcChannels = {
  modelSettingsInspect: "model-settings:inspect",
  modelSettingsSave: "model-settings:save",
  modelSettingsCheck: "model-settings:check",
  modelSettingsDiagnostics: "model-settings:diagnostics",
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
  shotsDelete: "shots:delete",
  localSetupPauseDownload: "local-setup:pause-download",
  localSetupCancelDownload: "local-setup:cancel-download",
  localSetupRequirementDownloadStatus:
    "local-setup:requirement-download-status",
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
  localSetupModelGroupsStatus: "local-setup:model-groups-status"
} as const;

const api: MagoDesktopApi = {
  textModel: {
    onRequest: (listener) => {
      const subscription = (_event: unknown, request: TextModelRequest) =>
        listener(request);
      ipcRenderer.on(ipcChannels.textModelRequest, subscription);
      return () => {
        ipcRenderer.removeListener(ipcChannels.textModelRequest, subscription);
      };
    },
    onCancel: (listener) => {
      const subscription = (_event: unknown, id: string) => listener(id);
      ipcRenderer.on(ipcChannels.textModelCancel, subscription);
      return () => {
        ipcRenderer.removeListener(ipcChannels.textModelCancel, subscription);
      };
    },
    respond: (response) =>
      ipcRenderer.send(ipcChannels.textModelResponse, response),
    ready: () => ipcRenderer.send(ipcChannels.textModelReady)
  },
  app: {
    version: () => ipcRenderer.invoke(ipcChannels.appVersion)
  },
  account: {
    mode: readAppMode(),
    chooseMode: (mode) =>
      ipcRenderer.invoke(ipcChannels.accountChooseMode, mode),
    signOut: () => ipcRenderer.invoke(ipcChannels.accountSignOut),
    onDeepLink: (listener) => {
      // The event object stays in the preload; only the validated payload
      // crosses into the page.
      const subscription = (
        _event: unknown,
        link: { action: string; params: Record<string, string> }
      ) => listener(link);
      ipcRenderer.on(ipcChannels.accountDeepLink, subscription);
      return () =>
        ipcRenderer.removeListener(ipcChannels.accountDeepLink, subscription);
    }
  },
  localSetup: {
    installerStatus: () =>
      ipcRenderer.invoke(ipcChannels.localSetupInstallerStatus),
    startInstaller: (request) =>
      ipcRenderer.invoke(ipcChannels.localSetupInstallerStart, request),
    modelGroupsStatus: () =>
      ipcRenderer.invoke(ipcChannels.localSetupModelGroupsStatus),
    pauseInstaller: () =>
      ipcRenderer.invoke(ipcChannels.localSetupInstallerPause),
    listDrives: () => ipcRenderer.invoke(ipcChannels.localSetupListDrives),
    selectStorageFolder: (folderPath) =>
      ipcRenderer.invoke(ipcChannels.localSetupSelectStorageFolder, folderPath),
    pauseDownload: (name) =>
      ipcRenderer.invoke(ipcChannels.localSetupPauseDownload, name),
    cancelDownload: (name) =>
      ipcRenderer.invoke(ipcChannels.localSetupCancelDownload, name),
    requirementDownloadStatus: (name) =>
      ipcRenderer.invoke(ipcChannels.localSetupRequirementDownloadStatus, name),
    downloadRequirement: (name, options) =>
      ipcRenderer.invoke(
        ipcChannels.localSetupDownloadRequirement,
        name,
        options
      ),
    downloadRequirements: (batchName, names) =>
      ipcRenderer.invoke(
        ipcChannels.localSetupDownloadRequirements,
        batchName,
        names
      ),
    probeHardware: () =>
      ipcRenderer.invoke(ipcChannels.localSetupProbeHardware),
    chooseFolder: () => ipcRenderer.invoke(ipcChannels.localSetupChooseFolder),
    acceptedModelLicenseRepos: () =>
      ipcRenderer.invoke(ipcChannels.localSetupAcceptedModelLicenseRepos),
    acceptModelLicenses: (huggingFaceRepos) =>
      ipcRenderer.invoke(
        ipcChannels.localSetupAcceptModelLicenses,
        huggingFaceRepos
      )
  },
  library: {
    get: () => ipcRenderer.invoke(ipcChannels.libraryGet),
    choose: () => ipcRenderer.invoke(ipcChannels.libraryChoose),
    reveal: () => ipcRenderer.invoke(ipcChannels.libraryReveal),
    issues: () => ipcRenderer.invoke(ipcChannels.libraryIssues),
    openLogs: () => ipcRenderer.invoke(ipcChannels.libraryOpenLogs),
    restoreBackup: () => ipcRenderer.invoke(ipcChannels.libraryRestoreBackup)
  },
  files: {
    getPath: (file) => webUtils.getPathForFile(file),
    saveAssetAs: (input) =>
      ipcRenderer.invoke(ipcChannels.filesSaveAssetAs, input),
    exportSbsVideo: (input) =>
      ipcRenderer.invoke(ipcChannels.filesExportSbsVideo, input),
    saveCloudStorageObjectAs: (input) =>
      ipcRenderer.invoke(ipcChannels.filesSaveCloudStorageObjectAs, input),
    onSbsExportProgress: (listener) => {
      const subscription = (
        _event: unknown,
        payload: Parameters<typeof listener>[0]
      ) => listener(payload);
      ipcRenderer.on(ipcChannels.filesSbsExportProgress, subscription);
      return () =>
        ipcRenderer.removeListener(
          ipcChannels.filesSbsExportProgress,
          subscription
        );
    }
  },
  assets: {
    get: (assetId) => ipcRenderer.invoke(ipcChannels.assetsGet, assetId),
    importImage: (input) =>
      ipcRenderer.invoke(ipcChannels.assetsImportImage, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.assetsUpdate, input),
    extractVideoFrame: (input) =>
      ipcRenderer.invoke(ipcChannels.assetsExtractVideoFrame, input),
    generateVideoFilmstrip: (input) =>
      ipcRenderer.invoke(ipcChannels.assetsGenerateVideoFilmstrip, input)
  },
  cloud: {
    links: {
      get: (kind, localId) =>
        ipcRenderer.invoke(ipcChannels.cloudLinkGet, kind, localId),
      put: (input) => ipcRenderer.invoke(ipcChannels.cloudLinkPut, input),
      patch: (input) => ipcRenderer.invoke(ipcChannels.cloudLinkPatch, input)
    },
    prepareUpload: (input) =>
      ipcRenderer.invoke(ipcChannels.cloudPrepareUpload, input),
    uploadPrepared: (input) =>
      ipcRenderer.invoke(ipcChannels.cloudUploadPrepared, input),
    assetInfo: (assetId) =>
      ipcRenderer.invoke(ipcChannels.cloudAssetInfo, assetId),
    uploadAsset: (input) =>
      ipcRenderer.invoke(ipcChannels.cloudUploadAsset, input),
    uploadBytes: (input) =>
      ipcRenderer.invoke(ipcChannels.cloudUploadBytes, input),
    cancelUploadBytes: (uploadId) =>
      ipcRenderer.invoke(ipcChannels.cloudCancelUploadBytes, uploadId),
    renders: {
      register: (input) =>
        ipcRenderer.invoke(ipcChannels.cloudRenderRegister, input),
      registerImage: (input) =>
        ipcRenderer.invoke(ipcChannels.cloudImageRenderRegister, input),
      listActive: () => ipcRenderer.invoke(ipcChannels.cloudRenderListActive),
      listQueue: () => ipcRenderer.invoke(ipcChannels.cloudRenderListQueue),
      finish: (input) =>
        ipcRenderer.invoke(ipcChannels.cloudRenderFinish, input),
      fail: (input) => ipcRenderer.invoke(ipcChannels.cloudRenderFail, input),
      setStatus: (input) =>
        ipcRenderer.invoke(ipcChannels.cloudRenderSetStatus, input)
    },
    onUploadProgress: (listener) => {
      const subscription = (
        _event: unknown,
        payload: { assetId: string; fraction: number }
      ) => listener(payload);
      ipcRenderer.on(ipcChannels.cloudUploadProgress, subscription);
      return () =>
        ipcRenderer.removeListener(
          ipcChannels.cloudUploadProgress,
          subscription
        );
    }
  },
  imageRenders: {
    submit: (input) =>
      ipcRenderer.invoke(ipcChannels.imageRendersSubmit, input),
    listQueue: () => ipcRenderer.invoke(ipcChannels.imageRendersListQueue),
    cancel: (jobId) =>
      ipcRenderer.invoke(ipcChannels.imageRendersCancel, jobId),
    markInteracted: (jobId) =>
      ipcRenderer.invoke(ipcChannels.imageRendersMarkInteracted, jobId)
  },
  models: {
    inspect: (request) =>
      ipcRenderer.invoke(ipcChannels.modelSettingsInspect, request),
    save: (request) =>
      ipcRenderer.invoke(ipcChannels.modelSettingsSave, request),
    check: (request) =>
      ipcRenderer.invoke(ipcChannels.modelSettingsCheck, request),
    diagnostics: (endpoint) =>
      ipcRenderer.invoke(ipcChannels.modelSettingsDiagnostics, endpoint)
  },
  comfy: {
    launch: (options) => ipcRenderer.invoke(ipcChannels.comfyLaunch, options),
    restartStatus: () => ipcRenderer.invoke(ipcChannels.comfyRestartStatus),
    restart: () => ipcRenderer.invoke(ipcChannels.comfyRestart),
    scriptSetupStatus: (options) =>
      ipcRenderer.invoke(ipcChannels.comfyScriptSetupStatus, options),
    get: () => ipcRenderer.invoke(ipcChannels.comfyGet),
    save: (settings, options) =>
      ipcRenderer.invoke(ipcChannels.comfySave, settings, options),
    check: (endpoint) => ipcRenderer.invoke(ipcChannels.comfyCheck, endpoint),
    modelStatus: (input) =>
      ipcRenderer.invoke(ipcChannels.comfyModelStatus, input)
  },
  vlm: {
    status: () => ipcRenderer.invoke(ipcChannels.vlmStatus),
    captionAsset: (assetId) =>
      ipcRenderer.invoke(ipcChannels.vlmCaptionAsset, assetId),
    autoPrompt: (input) => ipcRenderer.invoke(ipcChannels.vlmAutoPrompt, input),
    saveAutoPrompt: (input) =>
      ipcRenderer.invoke(ipcChannels.vlmSaveAutoPrompt, input),
    enhancePrompt: (input) =>
      ipcRenderer.invoke(ipcChannels.vlmEnhancePrompt, input),
    adaptI2vPrompt: (input) =>
      ipcRenderer.invoke(ipcChannels.vlmAdaptI2vPrompt, input)
  },
  videoRenders: {
    submit: (input) => ipcRenderer.invoke(ipcChannels.videoRendersSubmit, input)
  },
  tracks: {
    create: (input) => ipcRenderer.invoke(ipcChannels.tracksCreate, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.tracksUpdate, input),
    delete: (trackId) => ipcRenderer.invoke(ipcChannels.tracksDelete, trackId)
  },
  shots: {
    create: (input) => ipcRenderer.invoke(ipcChannels.shotsCreate, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.shotsUpdate, input),
    delete: (shotId) => ipcRenderer.invoke(ipcChannels.shotsDelete, shotId)
  },
  projects: {
    list: () => ipcRenderer.invoke(ipcChannels.projectsList),
    listAll: () => ipcRenderer.invoke(ipcChannels.projectsListAll),
    get: (projectId) => ipcRenderer.invoke(ipcChannels.projectsGet, projectId),
    mirrorCloud: (input) =>
      ipcRenderer.invoke(ipcChannels.projectsMirrorCloud, input),
    cancelCloudMirror: (projectId) =>
      ipcRenderer.invoke(ipcChannels.projectsCancelCloudMirror, projectId),
    cancelCloudAsset: (projectId, assetId) =>
      ipcRenderer.invoke(
        ipcChannels.projectsCancelCloudAsset,
        projectId,
        assetId
      ),
    cacheCloudAsset: (input) =>
      ipcRenderer.invoke(ipcChannels.projectsCacheCloudAsset, input),
    create: (input) => ipcRenderer.invoke(ipcChannels.projectsCreate, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.projectsUpdate, input),
    delete: (projectId) =>
      ipcRenderer.invoke(ipcChannels.projectsDelete, projectId),
    importVideos: (input) =>
      ipcRenderer.invoke(ipcChannels.projectsImportVideos, input),
    listShots: (projectId) =>
      ipcRenderer.invoke(ipcChannels.projectsListShots, projectId),
    stats: (projectId) =>
      ipcRenderer.invoke(ipcChannels.projectsStats, projectId)
  },
  scriptProjects: {
    cacheMedia: (projectId, sourceUrl) =>
      ipcRenderer.invoke(
        ipcChannels.scriptProjectsCacheMedia,
        projectId,
        sourceUrl
      ),
    cancelMedia: (projectId, sourceUrl) =>
      ipcRenderer.invoke(
        ipcChannels.scriptProjectsCancelMedia,
        projectId,
        sourceUrl
      ),
    put: (input) => ipcRenderer.invoke(ipcChannels.scriptProjectsPut, input),
    get: (projectId) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsGet, projectId),
    getPlan: (planId) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsGetPlan, planId),
    cancelPlan: (planId) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsCancelPlan, planId),
    resumePlan: (planId) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsResumePlan, planId),
    cast: (input) => ipcRenderer.invoke(ipcChannels.scriptProjectsCast, input),
    chatMessage: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsChatMessage, input),
    chatMessages: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsChatMessages, input),
    findMedia: (query) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsFindMedia, query),
    getRenderMetrics: (assetId) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsGetRenderMetrics, assetId),
    generateSheets: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsGenerateSheets, input),
    generateShots: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsGenerateShots, input),
    exportCut: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsExportCut, input),
    update: (input) =>
      ipcRenderer.invoke(ipcChannels.scriptProjectsUpdate, input)
  }
};

contextBridge.exposeInMainWorld("mago", api);
