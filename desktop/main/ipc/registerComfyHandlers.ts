import path from "node:path";

import { app, ipcMain } from "electron";

import {
  IPC_CHANNELS,
  LOCAL_SCRIPT_TEXT_MODELS,
  LOCAL_TEXT_MODEL_PROVIDERS,
  LOCAL_VLM_BACKENDS,
  type ComfySettings,
  type ComfyStatus,
  type LocalScriptTextModel,
  type LocalTextModelProvider,
  type LocalVlmBackend
} from "../../shared/contracts";
import { ComfyLauncher } from "../comfy/ComfyLauncher";
import { normalizeComfyEndpoint } from "../comfy/normalizeComfyEndpoint";
import { readComfyRestartStatus } from "../comfy/readComfyRestartStatus";
import { restartComfy } from "../comfy/restartComfy";
import {
  isComfyRenderModelName,
  probeComfyRenderModel
} from "../imageRenders/comfyModelValidation";
import { ComfyQwenClient } from "../imageRenders/comfyQwenClient";
import { LibrarySettings } from "../librarySettings";
import {
  evaluateScriptSetup,
  probeScriptSetup
} from "../localSetup/probeScriptSetup";
import { addSetupDestinations } from "../localSetup/setupDestinations";

import { requireTrustedSender } from "./trustedSender";

const check = async (settings: ComfySettings): Promise<ComfyStatus> => {
  const { endpoint } = settings;
  try {
    const normalized = normalizeComfyEndpoint(endpoint);
    await new ComfyQwenClient(normalized).validate();
    return {
      ...settings,
      endpoint: normalized,
      configured: true,
      available: true,
      message: null
    };
  } catch (error) {
    return {
      ...settings,
      configured: Boolean(endpoint.trim()),
      available: false,
      message: error instanceof Error ? error.message : "ComfyUI is unavailable"
    };
  }
};

const readComfySettings = async (
  settings: LibrarySettings
): Promise<ComfySettings> => ({
  endpoint: await settings.getComfyEndpoint(),
  vlmBackend: await settings.getVlmBackend(),
  scriptTextModel: await settings.getScriptTextModel(),
  textModelProvider: await settings.getTextModelProvider()
});

export const registerComfyHandlers = (settings: LibrarySettings): void => {
  const launcher = new ComfyLauncher(
    settings,
    path.join(app.getPath("userData"), "logs", "comfyui.log")
  );
  ipcMain.handle(IPC_CHANNELS.comfyRestartStatus, async (event) => {
    requireTrustedSender(event);
    return readComfyRestartStatus({
      launcher,
      endpoint: normalizeComfyEndpoint(await settings.getComfyEndpoint())
    });
  });
  ipcMain.handle(IPC_CHANNELS.comfyRestart, async (event) => {
    requireTrustedSender(event);
    await restartComfy({
      launcher,
      endpoint: normalizeComfyEndpoint(await settings.getComfyEndpoint())
    });
  });
  ipcMain.handle(IPC_CHANNELS.comfyLaunch, async (event, options) => {
    requireTrustedSender(event);
    const restartUnresponsiveProcess =
      options &&
      typeof options === "object" &&
      "restartUnresponsiveProcess" in options &&
      options.restartUnresponsiveProcess === true;
    await launcher.launch({ restartUnresponsiveProcess });
  });
  ipcMain.handle(
    IPC_CHANNELS.comfyScriptSetupStatus,
    async (event, options) => {
      requireTrustedSender(event);
      const probeSettings = await readComfySettings(settings);
      if (options?.scriptTextModel !== undefined) {
        if (!LOCAL_SCRIPT_TEXT_MODELS.includes(options.scriptTextModel))
          throw new Error("Unknown local script text model");
        probeSettings.scriptTextModel = options.scriptTextModel;
      }
      if (options?.vlmBackend !== undefined) {
        if (!LOCAL_VLM_BACKENDS.includes(options.vlmBackend))
          throw new Error("Unknown local vision language model");
        probeSettings.vlmBackend = options.vlmBackend;
      }
      if (options?.debugMissing === true) {
        return addSetupDestinations(
          evaluateScriptSetup({}, probeSettings),
          null,
          null
        );
      }
      const endpoint = normalizeComfyEndpoint(
        options?.endpoint ?? (await settings.getComfyEndpoint())
      );
      const result = await probeScriptSetup(endpoint, probeSettings);
      if (
        !options?.endpoint &&
        result.comfyRoot &&
        path.isAbsolute(result.comfyRoot) &&
        ["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname)
      ) {
        await settings.setInferredComfyInstall(
          endpoint,
          path.dirname(result.comfyRoot)
        );
      }
      return result;
    }
  );
  ipcMain.handle(IPC_CHANNELS.comfyGet, async (event) => {
    requireTrustedSender(event);
    return readComfySettings(settings);
  });
  ipcMain.handle(IPC_CHANNELS.comfySave, async (event, value, options) => {
    requireTrustedSender(event);
    const payload = value && typeof value === "object" ? value : null;
    const endpoint = normalizeComfyEndpoint(
      payload && "endpoint" in payload ? String(payload.endpoint) : ""
    );
    const requestedBackend =
      payload && "vlmBackend" in payload ? payload.vlmBackend : undefined;
    const requestedScriptTextModel =
      payload && "scriptTextModel" in payload
        ? payload.scriptTextModel
        : undefined;
    if (
      typeof requestedBackend !== "string" ||
      !LOCAL_VLM_BACKENDS.includes(requestedBackend as LocalVlmBackend)
    )
      throw new Error("Unknown local vision language model");
    if (
      typeof requestedScriptTextModel !== "string" ||
      !LOCAL_SCRIPT_TEXT_MODELS.includes(
        requestedScriptTextModel as LocalScriptTextModel
      )
    )
      throw new Error("Unknown local script text model");
    // Optional, so a caller saving only the ComfyUI fields keeps the choice.
    const requestedTextModelProvider =
      payload && "textModelProvider" in payload
        ? payload.textModelProvider
        : undefined;
    if (
      requestedTextModelProvider !== undefined &&
      !LOCAL_TEXT_MODEL_PROVIDERS.includes(
        requestedTextModelProvider as LocalTextModelProvider
      )
    )
      throw new Error("Unknown text model provider");
    await settings.setComfyEndpoint(endpoint);
    await settings.setVlmBackend(requestedBackend as LocalVlmBackend);
    await settings.setScriptTextModel(
      requestedScriptTextModel as LocalScriptTextModel
    );
    if (requestedTextModelProvider !== undefined)
      await settings.setTextModelProvider(
        requestedTextModelProvider as LocalTextModelProvider
      );
    const launchPath = await launcher.getLaunchPath();
    const status = await check(await readComfySettings(settings));
    if (options?.completeSetupOnConnection === true && status.available)
      await settings.markLocalSetupCompleted();
    return {
      ...status,
      canLaunch: launchPath !== null,
      launchPath,
      launchedProcess: launcher.getLaunchedProcess()
    };
  });
  ipcMain.handle(IPC_CHANNELS.comfyCheck, async (event, endpoint) => {
    requireTrustedSender(event);
    if (endpoint !== undefined) {
      if (typeof endpoint !== "string")
        throw new Error("Invalid ComfyUI endpoint");
      return check({
        ...(await readComfySettings(settings)),
        endpoint: normalizeComfyEndpoint(endpoint)
      });
    }
    const launchPath = await launcher.getLaunchPath();
    return {
      ...(await check(await readComfySettings(settings))),
      canLaunch: launchPath !== null,
      launchPath,
      launchedProcess: launcher.getLaunchedProcess()
    };
  });
  ipcMain.handle(IPC_CHANNELS.comfyModelStatus, async (event, value) => {
    requireTrustedSender(event);
    const payload = value && typeof value === "object" ? value : null;
    const model = payload && "model" in payload ? payload.model : undefined;
    if (!isComfyRenderModelName(model))
      throw new Error("Unknown local ComfyUI model");
    const modelSettings =
      payload &&
      "settings" in payload &&
      payload.settings &&
      typeof payload.settings === "object"
        ? (payload.settings as Record<string, unknown>)
        : {};
    return probeComfyRenderModel(
      await settings.getComfyEndpoint(),
      model,
      modelSettings
    );
  });
};
