import type {
  LocalSetupHardwareReport,
  LocalSetupHardwareVerdict
} from "../../shared/contracts";

export const MINIMUM_VIDEO_MEMORY_MEBIBYTES = 8000;
export const COMFORTABLE_VIDEO_MEMORY_MEBIBYTES = 16000;

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;
export const BYTES_PER_GIGABYTE = BYTES_PER_MEGABYTE * BYTES_PER_KILOBYTE;

export const describeGigabytes = (bytes: number | null): string =>
  bytes === null ? "Shared" : `${Math.round(bytes / BYTES_PER_GIGABYTE)} GB`;

export const resolveHardwareVerdict = ({
  graphicsCardName,
  videoMemoryBytes
}: {
  graphicsCardName: string;
  videoMemoryBytes: number | null;
}): LocalSetupHardwareVerdict => {
  const isNvidiaGraphicsCard = /nvidia|geforce|rtx|quadro|tesla/i.test(
    graphicsCardName
  );
  if (!isNvidiaGraphicsCard || videoMemoryBytes === null) return "blocked";

  const videoMemoryMebibytes = videoMemoryBytes / BYTES_PER_MEGABYTE;
  if (videoMemoryMebibytes < MINIMUM_VIDEO_MEMORY_MEBIBYTES) return "blocked";
  if (videoMemoryMebibytes < COMFORTABLE_VIDEO_MEMORY_MEBIBYTES) {
    return "limited";
  }
  return "ready";
};

export const parseMacosGraphicsCard = (
  systemProfilerJson: string
): { graphicsCardName: string; videoMemoryBytes: number | null } => {
  const fallback = { graphicsCardName: "Unknown", videoMemoryBytes: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(systemProfilerJson);
  } catch {
    return fallback;
  }

  const displays = (parsed as { SPDisplaysDataType?: unknown })
    ?.SPDisplaysDataType;
  if (!Array.isArray(displays) || displays.length === 0) return fallback;

  const card = displays[0] as Record<string, unknown>;
  const graphicsCardName =
    typeof card.sppci_model === "string" ? card.sppci_model : "Unknown";

  const vramText =
    typeof card.spdisplays_vram === "string"
      ? card.spdisplays_vram
      : typeof card._spdisplays_vramActive === "string"
        ? card._spdisplays_vramActive
        : null;

  return { graphicsCardName, videoMemoryBytes: parseVideoMemory(vramText) };
};

export const parseVideoMemory = (vramText: string | null): number | null => {
  if (!vramText) return null;
  const match = /([\d.]+)\s*(MiB|GiB|MB|GB)/i.exec(vramText);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const isMegabytes = /^(MB|MiB)$/i.test(match[2]);
  return isMegabytes
    ? amount * BYTES_PER_MEGABYTE
    : amount * BYTES_PER_GIGABYTE;
};

export const buildHardwareReport = ({
  graphicsCardName,
  videoMemoryBytes,
  systemMemoryBytes
}: {
  graphicsCardName: string;
  videoMemoryBytes: number | null;
  systemMemoryBytes: number;
}): LocalSetupHardwareReport => ({
  graphicsCardName,
  videoMemoryLabel: describeGigabytes(videoMemoryBytes),
  systemMemoryLabel: describeGigabytes(systemMemoryBytes),
  verdict: resolveHardwareVerdict({ graphicsCardName, videoMemoryBytes })
});
