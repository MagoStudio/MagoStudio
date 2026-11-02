import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import { VideoFrameService } from "../media/videoFrameService";

import { requireTrustedSender } from "./trustedSender";

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("media extraction input must be an object");
  }
  return value as Record<string, unknown>;
};

const string = (value: unknown, name: string): string => {
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const positiveNumber = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return value;
};

export const registerMediaHandlers = (service: VideoFrameService): void => {
  ipcMain.handle(IPC_CHANNELS.assetsExtractVideoFrame, (event, value) => {
    requireTrustedSender(event);
    const input = record(value);
    const frameNumber = Number(input.frameNumber);
    if (!Number.isInteger(frameNumber) || frameNumber < 0) {
      throw new Error("frameNumber must be a non-negative integer");
    }
    return service.extractFrame({
      assetId: string(input.assetId, "assetId"),
      frameNumber,
      fps: positiveNumber(input.fps, "fps")
    });
  });

  ipcMain.handle(IPC_CHANNELS.assetsGenerateVideoFilmstrip, (event, value) => {
    requireTrustedSender(event);
    const input = record(value);
    return service.generateFilmstrip({
      assetId: string(input.assetId, "assetId"),
      width: positiveNumber(input.width, "width"),
      frameHeight: positiveNumber(input.frameHeight, "frameHeight")
    });
  });
};
