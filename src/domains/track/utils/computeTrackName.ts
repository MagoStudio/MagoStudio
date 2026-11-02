import { VideoEngine } from "@models/video/types";

const ENGINE_SUFFIX_MAP: Partial<Record<VideoEngine, string>> = {
  [VideoEngine.v1_0_0_mask]: "Mask",
  [VideoEngine.v2_0_0_esrgan_upscaler]: "Upscale",
  [VideoEngine.v1_0_0_upscaler]: "CreativeUpscale",
  [VideoEngine.ltx_2_3_spatial_upscaler]: "LTXUpscale"
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface ComputeTrackNameInput {
  sourceTrackName: string;
  modelEngine: VideoEngine | string | undefined;
  existingTrackNames: string[];
  defaultName: string;
}

export const computeTrackName = ({
  sourceTrackName,
  modelEngine,
  existingTrackNames,
  defaultName
}: ComputeTrackNameInput): string => {
  const suffix = modelEngine
    ? ENGINE_SUFFIX_MAP[modelEngine as VideoEngine]
    : undefined;

  if (!suffix) return defaultName;

  const prefix = `${sourceTrackName}_${suffix}`;
  const pattern = new RegExp(`^${escapeRegExp(prefix)} \\((\\d+)\\)$`);

  const existingNumbers = existingTrackNames
    .map((name) => pattern.exec(name)?.[1])
    .filter((match): match is string => match !== undefined)
    .map((match) => Number.parseInt(match, 10))
    .filter((n) => Number.isFinite(n));

  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

  return `${prefix} (${nextNumber})`;
};
