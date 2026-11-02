import { probeHardware } from "./probeHardware";

let videoMemoryBytesProbe: Promise<number | null> | null = null;

export const readVideoMemoryBytesOnce = (): Promise<number | null> => {
  videoMemoryBytesProbe ??= probeHardware()
    .then((report) => report.videoMemoryBytes ?? null)
    .catch(() => null);
  return videoMemoryBytesProbe;
};
