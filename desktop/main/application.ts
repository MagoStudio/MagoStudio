import path from "node:path";

import { app, BrowserWindow, shell } from "electron";

import {
  inWindowNavigationHosts,
  resolveCloudConfig
} from "../shared/cloudConfig";
import { IPC_CHANNELS } from "../shared/contracts";

import { CloudLinkRepository } from "./cloud/cloudLinkRepository";
import { CloudRenderJobRepository } from "./cloud/cloudRenderJobRepository";
import { CloudRenderSubmitService } from "./cloud/cloudRenderSubmitService";
import { UploadService } from "./cloud/uploadService";
import { closeAllComfyProgressMonitors } from "./comfy/comfyProgressMonitors";
import { CloudProjectMirrorRepository } from "./database/cloudProjectMirrorRepository";
import { DatabaseManager } from "./database/databaseManager";
import { ProjectRepository } from "./database/projectRepository";
import { ScriptChatMessageRepository } from "./database/scriptChatMessageRepository";
import { ScriptProjectSnapshotRepository } from "./database/scriptProjectSnapshotRepository";
import {
  DeepLink,
  listenForDeepLinks,
  registerDeepLinkScheme
} from "./deepLink";
import { ImageRenderService } from "./imageRenders/imageRenderService";
import { registerAccountHandlers } from "./ipc/registerAccountHandlers";
import { registerCloudHandlers } from "./ipc/registerCloudHandlers";
import { registerCloudStorageHandlers } from "./ipc/registerCloudStorageHandlers";
import { registerComfyHandlers } from "./ipc/registerComfyHandlers";
import { registerImageRenderHandlers } from "./ipc/registerImageRenderHandlers";
import { registerLibraryHandlers } from "./ipc/registerLibraryHandlers";
import { registerLocalSetupHandlers } from "./ipc/registerLocalSetupHandlers";
import { registerMediaHandlers } from "./ipc/registerMediaHandlers";
import { registerProjectHandlers } from "./ipc/registerProjectHandlers";
import { registerScriptProjectHandlers } from "./ipc/registerScriptProjectHandlers";
import { registerVlmHandlers } from "./ipc/registerVlmHandlers";
import { TextModelBridge } from "./ipc/textModelBridge";
import { runBackgroundTask } from "./libraryHealth";
import { LibrarySettings } from "./librarySettings";
import { VideoFrameService } from "./media/videoFrameService";
import { openStartupLibrary } from "./openStartupLibrary";
import {
  ensureRendererCertificate,
  installHostResolverRule,
  pinRendererCertificate,
  RendererOrigin,
  rendererPort,
  startRendererOrigin
} from "./renderer/rendererOrigin";
import { registerMediaProtocol } from "./rendererProtocol";
import { ComfyScriptProjectClient } from "./scriptProjects/comfyScriptProjectClient";
import { LocalScriptChatService } from "./scriptProjects/localScriptChatService";
import { LocalScriptProjectService } from "./scriptProjects/localScriptProjectService";
import { failStartup, logStartup, startupComplete } from "./startupDiagnostics";
import { LocalI2vPromptAdapter } from "./vlm/localI2vPromptAdapter";
import { VlmService } from "./vlm/vlmService";

const databaseManager = new DatabaseManager();
const librarySettings = new LibrarySettings();
const projectRepository = new ProjectRepository(databaseManager, () =>
  librarySettings.getLibraryRoot()
);
const cloudProjectMirrorRepository = new CloudProjectMirrorRepository(
  databaseManager,
  () => librarySettings.getLibraryRoot()
);
const scriptProjectSnapshotRepository = new ScriptProjectSnapshotRepository(
  databaseManager,
  () => librarySettings.getLibraryRoot()
);
const vlmService = new VlmService(projectRepository, librarySettings);
// Every image that lands in the library gets a description, the way
// The backend describes every upload and render.
const describeImageLater = (assetId: string) =>
  vlmService.describeAssetLater(assetId);
const i2vPromptAdapter = new LocalI2vPromptAdapter({
  getAsset: (assetId) => projectRepository.getAsset(assetId),
  describeImage: (assetId) => vlmService.describeImageAsset(assetId),
  captionVideo: async (assetId) =>
    (await vlmService.captionAsset(assetId)).prompt,
  runTextPrompt: async (prompt) =>
    new ComfyScriptProjectClient(
      await librarySettings.getComfyEndpoint(),
      await librarySettings.getScriptTextModel()
    ).runPromptAdaptation(prompt)
});
const textModelBridge = new TextModelBridge();
const localScriptProjectService = new LocalScriptProjectService(
  projectRepository,
  scriptProjectSnapshotRepository,
  () => librarySettings.getComfyEndpoint(),
  () => librarySettings.getScriptTextModel(),
  (sourcePath, kind) => vlmService.describeEntityImage(sourcePath, kind),
  textModelBridge.run,
  (input) => vlmService.evaluateShotVideo(input)
);
const localScriptChatService = new LocalScriptChatService(
  new ScriptChatMessageRepository(databaseManager),
  (projectId) => localScriptProjectService.assertLocalProject(projectId),
  async (prompt) => {
    const cloud = await textModelBridge.run("chat", { prompt });
    if (cloud) return { content: String(cloud.content), model: "cloud" };
    return new ComfyScriptProjectClient(
      await librarySettings.getComfyEndpoint(),
      await librarySettings.getScriptTextModel()
    ).runScriptChat(prompt);
  }
);
const cloudLinkRepository = new CloudLinkRepository(databaseManager);
const uploadService = new UploadService(() => librarySettings.getLibraryRoot());
const cloudRenderJobRepository = new CloudRenderJobRepository(databaseManager);
const cloudRenderSubmitService = new CloudRenderSubmitService(
  databaseManager,
  () => librarySettings.getLibraryRoot(),
  describeImageLater
);
const imageRenderService = new ImageRenderService(
  databaseManager,
  () => librarySettings.getLibraryRoot(),
  () => librarySettings.getComfyEndpoint(),
  describeImageLater
);
const videoFrameService = new VideoFrameService(projectRepository);
const usesPackagedRenderer =
  app.isPackaged || process.env.MAGO_PACKAGED_SMOKE === "1";
const developmentRendererUrl = process.env.MAGO_RENDERER_URL;
const cloudConfig = resolveCloudConfig();

/**
 * Bring up the https origin the renderer is served from, and point its hostname
 * at the loopback listener.
 *
 * The resolver rule is installed synchronously, at module load: Chromium reads
 * that switch while starting its network service, so installing it after any
 * `await` is too late and the hostname fails to resolve. That is why the port is
 * fixed rather than ephemeral — it has to be known before the listener binds.
 */
const rendererOriginPromise: Promise<RendererOrigin> | null = (() => {
  if (!usesPackagedRenderer && !developmentRendererUrl) return null;

  const port = rendererPort();
  installHostResolverRule({ host: cloudConfig.rendererHost, port });

  return (async () => {
    const certificate = await ensureRendererCertificate(
      cloudConfig.rendererHost
    );
    return startRendererOrigin({
      ...(developmentRendererUrl
        ? { upstreamUrl: developmentRendererUrl }
        : { rendererRoot: path.join(app.getAppPath(), "out") }),
      certificate,
      port,
      config: cloudConfig
    });
  })();
})();

registerDeepLinkScheme();

const pendingDeepLinks: DeepLink[] = [];
let deepLinkTarget: BrowserWindow | null = null;

const deliverDeepLink = (link: DeepLink): void => {
  if (!deepLinkTarget || deepLinkTarget.isDestroyed()) {
    pendingDeepLinks.push(link);
    return;
  }
  deepLinkTarget.webContents.send(IPC_CHANNELS.accountDeepLink, link);
  if (deepLinkTarget.isMinimized()) deepLinkTarget.restore();
  deepLinkTarget.focus();
};

const isSingleInstance = listenForDeepLinks(deliverDeepLink);
if (!isSingleInstance) app.quit();
app.on("second-instance", () => {
  if (!deepLinkTarget || deepLinkTarget.isDestroyed()) return;
  if (deepLinkTarget.isMinimized()) deepLinkTarget.restore();
  deepLinkTarget.show();
  deepLinkTarget.focus();
});

const createWindow = async (): Promise<BrowserWindow> => {
  logStartup("Waiting for renderer origin and settings");
  const origin = await rendererOriginPromise;
  const appMode = (await librarySettings.getAppMode()) ?? "unchosen";
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0c0c0e",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      additionalArguments: [`--mago-app-mode=${appMode}`]
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).protocol === "https:") void shell.openExternal(url);
    } catch {
      // Invalid and non-HTTPS URLs remain blocked.
    }
    return { action: "deny" };
  });
  const allowedHosts = new Set(inWindowNavigationHosts(cloudConfig));
  window.webContents.on("will-navigate", (event, url) => {
    const isDevelopmentApp =
      !app.isPackaged &&
      (url.startsWith("http://127.0.0.1:") ||
        url.startsWith("http://localhost:"));
    if (isDevelopmentApp) return;

    let target: URL | null = null;
    try {
      target = new URL(url);
    } catch {
      target = null;
    }
    // The sign-in chain -- our origin, Clerk's frontend API, the OAuth provider
    // -- must navigate in place, because the session cookie it produces has to
    // land in this window's cookie jar. Everything else opens in the user's real
    // browser: Stripe checkout, documentation, any stray link.
    if (target?.protocol === "https:" && allowedHosts.has(target.host)) return;

    event.preventDefault();
    if (target?.protocol === "https:") void shell.openExternal(target.href);
  });

  if (origin) {
    pinRendererCertificate(window.webContents.session, origin);
  }

  window.webContents.on("console-message", (details) => {
    if (details.level === "error") {
      logStartup(
        `Renderer error: ${details.message} (${details.sourceId}:${details.lineNumber})`
      );
    }
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    failStartup(
      new Error(`Renderer exited: ${details.reason} (${details.exitCode})`)
    );
  });
  window.webContents.on("unresponsive", () => {
    logStartup("Renderer is unresponsive");
    window.show();
  });
  window.once("ready-to-show", () => {
    window.show();
    startupComplete();
  });
  logStartup("Loading application window");
  await window.loadURL(origin?.url || "about:blank");

  deepLinkTarget = window;
  while (pendingDeepLinks.length > 0) {
    const link = pendingDeepLinks.shift();
    if (link) deliverDeepLink(link);
  }
  return window;
};

void app
  .whenReady()
  .then(async () => {
    logStartup("Electron ready; registering services");
    registerMediaProtocol(projectRepository, scriptProjectSnapshotRepository);
    registerComfyHandlers(librarySettings);
    textModelBridge.register();
    registerCloudHandlers({
      links: cloudLinkRepository,
      uploads: uploadService,
      repository: projectRepository,
      renderJobs: cloudRenderJobRepository,
      renderSubmits: cloudRenderSubmitService,
      databaseManager,
      getLibraryRoot: () => librarySettings.getLibraryRoot()
    });
    registerImageRenderHandlers(imageRenderService, cloudRenderJobRepository);
    registerMediaHandlers(videoFrameService);
    registerCloudStorageHandlers();
    registerVlmHandlers(vlmService, i2vPromptAdapter);

    registerLocalSetupHandlers({ settings: librarySettings });

    registerLibraryHandlers({
      settings: librarySettings,
      databaseManager,
      repository: projectRepository
    });
    registerProjectHandlers(
      projectRepository,
      cloudProjectMirrorRepository,
      databaseManager,
      librarySettings,
      describeImageLater
    );
    registerScriptProjectHandlers({
      repository: scriptProjectSnapshotRepository,
      service: localScriptProjectService,
      chat: localScriptChatService,
      databaseManager,
      settings: librarySettings
    });
    registerAccountHandlers({
      settings: librarySettings,
      rebuildWindow: async () => {
        const existing = BrowserWindow.getAllWindows();
        const replacement = await createWindow();
        for (const window of existing) {
          if (window !== replacement) window.destroy();
        }
      }
    });

    if (!(await openStartupLibrary(databaseManager, librarySettings))) {
      app.quit();
      return;
    }
    await createWindow();
    void runBackgroundTask("Interrupted render recovery", async () => {
      await imageRenderService.reconcileInterruptedRenders();
      imageRenderService.start();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0)
        void createWindow().catch(failStartup);
    });
  })
  .catch(failStartup);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  void rendererOriginPromise?.then((origin) => origin.close());
  imageRenderService.stop();
  closeAllComfyProgressMonitors();
  databaseManager.close();
});
