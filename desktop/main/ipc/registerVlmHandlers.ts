import { ipcMain } from "electron";

import {
  IPC_CHANNELS,
  LOCAL_AUTO_PROMPT_VERSIONS,
  type LocalAdaptI2vPromptInput,
  type LocalAutoPromptInput,
  type LocalAutoPromptSaveInput,
  type LocalAutoPromptVersion,
  type LocalEnhancePromptInput
} from "../../shared/contracts";
import type { LocalI2vPromptAdapter } from "../vlm/localI2vPromptAdapter";
import { VlmService } from "../vlm/vlmService";

import { requireTrustedSender } from "./trustedSender";

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object payload");
  return value as Record<string, unknown>;
};

const text = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value)
    throw new Error(`${field} is required`);
  return value;
};

const optionalText = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;

const version = (value: unknown): LocalAutoPromptVersion => {
  if (
    typeof value !== "string" ||
    !LOCAL_AUTO_PROMPT_VERSIONS.includes(value as LocalAutoPromptVersion)
  )
    throw new Error(
      `version must be one of ${LOCAL_AUTO_PROMPT_VERSIONS.join(", ")}`
    );
  return value as LocalAutoPromptVersion;
};

const autoPromptInput = (value: unknown): LocalAutoPromptInput => {
  const payload = record(value);
  return {
    version: version(payload.version),
    styleReferenceImage: text(
      payload.styleReferenceImage,
      "styleReferenceImage"
    ),
    sourceVideoFrame: optionalText(payload.sourceVideoFrame),
    motionDescription: optionalText(payload.motionDescription)
  };
};

const autoPromptSaveInput = (value: unknown): LocalAutoPromptSaveInput => {
  const payload = record(value);
  return {
    assetId: text(payload.assetId, "assetId"),
    videoAssetId: text(payload.videoAssetId, "videoAssetId"),
    version: version(payload.version),
    positivePrompt: text(payload.positivePrompt, "positivePrompt")
  };
};

const enhancePromptInput = (value: unknown): LocalEnhancePromptInput => {
  const payload = record(value);
  return {
    query: text(payload.query, "query"),
    version: optionalText(payload.version)
  };
};

const optionalPositiveNumber = (
  value: unknown,
  field: string
): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    throw new Error(`${field} must be a positive number`);
  return value;
};

/** The cloud endpoint's request checks (i2v_prompt.py `adapt_i2v_prompt`). */
const adaptI2vPromptInput = (value: unknown): LocalAdaptI2vPromptInput => {
  const payload = record(value);
  const referenceAssetIds = payload.reference_asset_ids ?? [];
  if (
    !Array.isArray(referenceAssetIds) ||
    !referenceAssetIds.every((id) => typeof id === "string" && id)
  )
    throw new Error("reference_asset_ids must be a list of asset ids");
  return {
    prompt: text(payload.prompt, "prompt"),
    reference_asset_ids: referenceAssetIds as string[],
    engine: optionalText(payload.engine),
    duration_s: optionalPositiveNumber(payload.duration_s, "duration_s"),
    aspect: optionalText(payload.aspect)
  };
};

export const registerVlmHandlers = (
  service: VlmService,
  i2vPromptAdapter: LocalI2vPromptAdapter
): void => {
  ipcMain.handle(IPC_CHANNELS.vlmStatus, async (event) => {
    requireTrustedSender(event);
    return service.status();
  });
  ipcMain.handle(IPC_CHANNELS.vlmCaptionAsset, async (event, assetId) => {
    requireTrustedSender(event);
    return service.captionAsset(text(assetId, "assetId"));
  });
  ipcMain.handle(IPC_CHANNELS.vlmAutoPrompt, async (event, input) => {
    requireTrustedSender(event);
    return service.autoPrompt(autoPromptInput(input));
  });
  ipcMain.handle(IPC_CHANNELS.vlmSaveAutoPrompt, async (event, input) => {
    requireTrustedSender(event);
    return service.saveAutoPrompt(autoPromptSaveInput(input));
  });
  ipcMain.handle(IPC_CHANNELS.vlmEnhancePrompt, async (event, input) => {
    requireTrustedSender(event);
    return service.enhancePrompt(enhancePromptInput(input));
  });
  ipcMain.handle(IPC_CHANNELS.vlmAdaptI2vPrompt, async (event, input) => {
    requireTrustedSender(event);
    return i2vPromptAdapter.adapt(adaptI2vPromptInput(input));
  });
};
