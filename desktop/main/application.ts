import { execFileSync } from "node:child_process";
import path from "node:path";

import { app, BrowserWindow, dialog, session, shell } from "electron";

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
import { registerModelSettingsHandlers } from "./ipc/registerModelSettingsHandlers";
import { registerProjectHandlers } from "./ipc/registerProjectHandlers";
import { registerScriptProjectHandlers } from "./ipc/registerScriptProjectHandlers";
import { registerVlmHandlers } from "./ipc/registerVlmHandlers";
import { TextModelBridge } from "./ipc/textModelBridge";
import { runBackgroundTask } from "./libraryHealth";
import { LibrarySettings } from "./librarySettings";
import { VideoFrameService } from "./media/videoFrameService";
import { configureModelRuntimeHooks } from "./modelSettings/modelRuntimeHooks";
import { ModelSettingsService } from "./modelSettings/ModelSettingsService";
import { ModelSettingsStore } from "./modelSettings/ModelSettingsStore";
import { openStartupLibrary } from "./openStartupLibrary";
import { installOfflineRenderer } from "./renderer/offlineRenderer";
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
import {
  failStartup,
  logStartup,
  pauseStartupTimeout,
  resumeStartupTimeout,
  startupComplete
} from "./startupDiagnostics";
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
const RENDERER_LOAD_TIMEOUT_MS = 15_000;
let windowsBeingCreated = 0;

/**
 * Bring up the https origin the renderer is served from, and point its hostname
 * at the loopback listener.
 *
 * The resolver rule is installed synchronously, at module load: Chromium reads
 * that switch while starting its network service, so installing it after any
 * `await` is too late and the hostname fails to resolve. That is why the port is
 * fixed rather than ephemeral — it has to be known before the listener binds.
 */
const port = rendererPort();
if (usesPackagedRenderer || developmentRendererUrl) {
  installHostResolverRule({ host: cloudConfig.rendererHost, port });
}
let rendererOriginPromise: Promise<RendererOrigin> | null = null;
let offlineRendererInstalled = false;
const getRendererOrigin = (): Promise<RendererOrigin> | null => {
  if (!usesPackagedRenderer && !developmentRendererUrl) return null;
  // Offline startup must never wait for a certificate or a listening socket.
  rendererOriginPromise ??= (async () => {
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
  })().catch((error: unknown) => {
    rendererOriginPromise = null;
    throw error;
  });
  return rendererOriginPromise;
};

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

const createWindowOnce = async (): Promise<BrowserWindow> => {
  logStartup("Waiting for renderer origin and settings");
  const appMode = (await librarySettings.getAppMode()) ?? "unchosen";
  const useOfflineRenderer = usesPackagedRenderer && appMode === "offline";
  if (useOfflineRenderer && !offlineRendererInstalled) {
    installOfflineRenderer(
      session.defaultSession,
      path.join(app.getAppPath(), "out"),
      cloudConfig
    );
    offlineRendererInstalled = true;
    logStartup(
      "Offline renderer: serving bundled files directly (no TLS listener)"
    );
  } else if (!useOfflineRenderer && offlineRendererInstalled) {
    session.defaultSession.protocol.unhandle("https");
    offlineRendererInstalled = false;
  }
  const origin = useOfflineRenderer ? null : await getRendererOrigin();
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
  let loadTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      window.loadURL(
        useOfflineRenderer
          ? `https://${cloudConfig.rendererHost}/`
          : origin?.url || "about:blank"
      ),
      new Promise<never>((_resolve, reject) => {
        // Next's development server can need longer for its first compilation.
        if (!usesPackagedRenderer) return;
        loadTimer = setTimeout(() => {
          reject(
            new Error("The application window did not load within 15 seconds.")
          );
        }, RENDERER_LOAD_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    window.destroy();
    throw error;
  } finally {
    clearTimeout(loadTimer);
  }

  deepLinkTarget = window;
  while (pendingDeepLinks.length > 0) {
    const link = pendingDeepLinks.shift();
    if (link) deliverDeepLink(link);
  }
  return window;
};

const createWindow = async (): Promise<BrowserWindow> => {
  windowsBeingCreated += 1;
  try {
    return await createWindowOnce();
  } catch (error) {
    if (
      !usesPackagedRenderer ||
      (await librarySettings.getAppMode()) === "offline"
    ) {
      throw error;
    }
    logStartup(`Cloud renderer startup failed: ${String(error)}`);
    pauseStartupTimeout();
    const { response } = await dialog.showMessageBox({
      type: "warning",
      title: "Mago Studio could not open cloud sign-in",
      message: "You can continue working offline.",
      detail:
        "Cloud sign-in could not start. Your local library is available in offline mode. You can try signing in again later.",
      buttons: ["Work offline", "Show error"],
      defaultId: 0,
      cancelId: 1
    });
    if (response !== 0) throw error;
    await librarySettings.setAppMode("offline");
    resumeStartupTimeout();
    return await createWindowOnce();
  } finally {
    windowsBeingCreated -= 1;
  }
};

void app
  .whenReady()
  .then(async () => {
    logStartup("Electron ready; registering services");
    let modelCommit = process.env.NEXT_PUBLIC_COMMIT_HASH ?? "unknown";
    if (!app.isPackaged)
      try {
        modelCommit = execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: app.getAppPath(),
          windowsHide: true,
          timeout: 2000,
          encoding: "utf8"
        }).trim();
      } catch {}
    const modelSettingsService = new ModelSettingsService(
      new ModelSettingsStore(
        path.join(app.getPath("userData"), "model-settings.json")
      ),
      librarySettings,
      {
        version: app.getVersion(),
        commit: modelCommit,
        development: !app.isPackaged
      }
    );
    configureModelRuntimeHooks({
      prepare: (endpoint, graph) =>
        modelSettingsService.prepare(endpoint, graph),
      observe: (endpoint, stats) =>
        modelSettingsService.observe(endpoint, stats),
      memoryPolicy: async (endpoint) =>
        (await modelSettingsService.store.endpoint(endpoint)).settings
          ?.memoryPolicy ?? "auto",
      textModelPath: (endpoint) => modelSettingsService.textModelPath(endpoint),
      allowsCpuTextInstall: async () => {
        const endpoint = await librarySettings.getComfyEndpoint();
        return (
          (await modelSettingsService.store.endpoint(endpoint)).settings?.models
            .text?.text.mode === "cpu"
        );
      },
      failed: (endpoint, message, graph) =>
        modelSettingsService.recordFailure(endpoint, message, graph)
    });
    registerModelSettingsHandlers(modelSettingsService);
    void librarySettings
      .getComfyEndpoint()
      .then((endpoint) => modelSettingsService.refresh(endpoint))
      .catch((error) =>
        logStartup(`Model diagnostics unavailable: ${String(error)}`)
      );
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

    registerLocalSetupHandlers({
      settings: librarySettings,
      onSetupComplete: async () =>
        modelSettingsService.refresh(await librarySettings.getComfyEndpoint())
    });

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
  // A failed cloud window is destroyed before its offline replacement opens.
  if (windowsBeingCreated > 0) return;
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  void rendererOriginPromise?.then((origin) => origin.close());
  imageRenderService.stop();
  closeAllComfyProgressMonitors();
  databaseManager.close();
});
