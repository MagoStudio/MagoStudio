import type { LocalSetupHardwareReport } from "../../shared/contracts";

import {
  buildHardwareReport,
  BYTES_PER_GIGABYTE,
  parseVideoMemory
} from "./resolveHardwareVerdict";
const MEBIBYTES_PER_GIBIBYTE = 1024;

export type GraphicsCard = {
  graphicsCardName: string;
  videoMemoryBytes: number | null;
  sharedOnly?: boolean;
};

export const parseNvidiaCards = (output: string | null): GraphicsCard[] =>
  (output ?? "")
    .trim()
    .split(/\r?\n/)
    .flatMap((line) => {
      const separator = line.lastIndexOf(",");
      if (separator < 0) return [];
      const graphicsCardName = line.slice(0, separator).trim();
      const memory = line.slice(separator + 1).trim();
      const amount = Number(memory);
      return graphicsCardName
        ? [
            {
              graphicsCardName,
              videoMemoryBytes:
                memory && Number.isFinite(amount) && amount > 0
                  ? (amount * BYTES_PER_GIGABYTE) / MEBIBYTES_PER_GIBIBYTE
                  : parseVideoMemory(memory)
            }
          ]
        : [];
    });

const isSharedAdapter = (name: string) =>
  /intel.*(?:uhd|hd graphics|iris)|amd radeon\(tm\) graphics|^amd radeon graphics$|radeon.*(?:\b[6789]\d0m\b)|apple m\d|microsoft basic|remote display/i.test(
    name
  );
export const parseWindowsCards = (output: string | null): GraphicsCard[] => {
  try {
    const parsed: unknown = JSON.parse(output ?? "null");
    const entries = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    return entries.flatMap((item) => {
      if (!item || typeof item.Name !== "string") return [];
      // Never use CIM's uint32 AdapterRAM: modern cards overflow at 4 GiB.
      const bytes =
        typeof item.DedicatedBytes === "number" && item.DedicatedBytes > 0
          ? item.DedicatedBytes
          : null;
      return [
        {
          graphicsCardName: item.Name,
          videoMemoryBytes: bytes,
          sharedOnly:
            isSharedAdapter(item.Name) &&
            (bytes === null || bytes <= BYTES_PER_GIGABYTE)
        }
      ];
    });
  } catch {
    return [];
  }
};

export const mergeGraphicsCards = (
  primary: GraphicsCard[],
  fallback: GraphicsCard[]
): GraphicsCard[] => {
  const remaining = [...primary];
  const extras = fallback.filter((card) => {
    const index = remaining.findIndex(
      (candidate) =>
        candidate.graphicsCardName.toLowerCase() ===
        card.graphicsCardName.toLowerCase()
    );
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  return [...primary, ...extras];
};

export const buildMultiGpuReport = (
  cards: GraphicsCard[],
  systemMemoryBytes: number
): LocalSetupHardwareReport => {
  const dedicated = cards.filter(
    (card) => !card.sharedOnly && !isSharedAdapter(card.graphicsCardName)
  );
  dedicated.sort(
    (a, b) => (b.videoMemoryBytes ?? -1) - (a.videoMemoryBytes ?? -1)
  );
  const selected = dedicated[0] ?? {
    graphicsCardName: cards.length ? "No dedicated GPU detected" : "Unknown",
    videoMemoryBytes: null
  };
  const report = buildHardwareReport({ ...selected, systemMemoryBytes });
  return {
    ...report,
    videoMemoryBytes: selected.videoMemoryBytes,
    videoMemoryLabel:
      selected.videoMemoryBytes === null ? "Unknown" : report.videoMemoryLabel,
    graphicsCards: dedicated.map((card, index) => ({
      name: card.graphicsCardName,
      videoMemoryLabel:
        card.videoMemoryBytes === null
          ? "Unknown"
          : `${Math.round(card.videoMemoryBytes / BYTES_PER_GIGABYTE)} GB`,
      selected: index === 0
    })),
    skippedSharedGpuCount: cards.length - dedicated.length
  };
};
