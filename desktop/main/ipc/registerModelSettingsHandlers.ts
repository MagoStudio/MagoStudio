import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import {
  modelCheckRequestSchema,
  modelSettingsMutationSchema,
  modelSettingsRequestSchema
} from "../modelSettings/modelSettingsSchema";
import type { ModelSettingsService } from "../modelSettings/ModelSettingsService";

import { requireTrustedSender } from "./trustedSender";

export const registerModelSettingsHandlers = (
  service: ModelSettingsService
): void => {
  ipcMain.handle(IPC_CHANNELS.modelSettingsInspect, (event, value) => {
    requireTrustedSender(event);
    return service.inspect(modelSettingsRequestSchema.parse(value));
  });
  ipcMain.handle(IPC_CHANNELS.modelSettingsSave, (event, value) => {
    requireTrustedSender(event);
    return service.save(modelSettingsMutationSchema.parse(value));
  });
  ipcMain.handle(IPC_CHANNELS.modelSettingsCheck, (event, value) => {
    requireTrustedSender(event);
    return service.check(modelCheckRequestSchema.parse(value));
  });
  ipcMain.handle(IPC_CHANNELS.modelSettingsDiagnostics, (event, value) => {
    requireTrustedSender(event);
    if (value !== undefined && typeof value !== "string")
      throw new Error("Invalid endpoint");
    return service.diagnostics(value);
  });
};
