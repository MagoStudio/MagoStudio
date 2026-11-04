import { describe, expect, it } from "vitest";

import {
  buildHardwareReport,
  describeGigabytes,
  parseMacosGraphicsCard,
  parseVideoMemory,
  resolveHardwareVerdict
} from "./resolveHardwareVerdict";

const gigabytes = (amount: number) => amount * 1024 ** 3;

describe("resolveHardwareVerdict", () => {
  it("clears a roomy NVIDIA card", () => {
    expect(
      resolveHardwareVerdict({
        graphicsCardName: "NVIDIA GeForce RTX 4090",
        videoMemoryBytes: gigabytes(24)
      })
    ).toBe("ready");
  });

  it("limits an NVIDIA card between the floor and the comfortable bar", () => {
    expect(
      resolveHardwareVerdict({
        graphicsCardName: "NVIDIA GeForce RTX 3080",
        videoMemoryBytes: gigabytes(10)
      })
    ).toBe("limited");
  });

  it("blocks an NVIDIA card below the eight gigabyte floor", () => {
    expect(
      resolveHardwareVerdict({
        graphicsCardName: "NVIDIA GeForce GTX 1060",
        videoMemoryBytes: gigabytes(6)
      })
    ).toBe("blocked");
  });

  it.each([
    [7999, "blocked"],
    [8000, "limited"],
    [8188, "limited"],
    [8192, "limited"],
    [15999, "limited"],
    [16000, "ready"],
    [16380, "ready"],
    [16384, "ready"],
    [6144, "blocked"],
    [7680, "blocked"]
  ] as const)(
    "applies the explicit memory thresholds for %i MiB (%s)",
    (mebibytes, verdict) => {
      expect(
        resolveHardwareVerdict({
          graphicsCardName: "NVIDIA GeForce RTX",
          videoMemoryBytes: mebibytes * 1024 ** 2
        })
      ).toBe(verdict);
    }
  );

  it("blocks a card that is not NVIDIA however much memory it reports", () => {
    expect(
      resolveHardwareVerdict({
        graphicsCardName: "AMD Radeon RX 7900",
        videoMemoryBytes: gigabytes(24)
      })
    ).toBe("blocked");
  });

  it("blocks shared memory, which is what Apple Silicon reports", () => {
    expect(
      resolveHardwareVerdict({
        graphicsCardName: "Apple M2",
        videoMemoryBytes: null
      })
    ).toBe("blocked");
  });
});

describe("parseVideoMemory", () => {
  it("reads gigabytes and megabytes", () => {
    expect(parseVideoMemory("24 GB")).toBe(gigabytes(24));
    expect(parseVideoMemory("8192 MB")).toBe(8192 * 1024 ** 2);
  });

  it("returns null for text that carries no amount", () => {
    expect(parseVideoMemory("Shared")).toBeNull();
    expect(parseVideoMemory(null)).toBeNull();
  });
});

describe("parseMacosGraphicsCard", () => {
  it("reads the first display's model and video memory", () => {
    const output = JSON.stringify({
      SPDisplaysDataType: [
        { sppci_model: "NVIDIA GeForce RTX 4090", spdisplays_vram: "24 GB" }
      ]
    });
    expect(parseMacosGraphicsCard(output)).toEqual({
      graphicsCardName: "NVIDIA GeForce RTX 4090",
      videoMemoryBytes: gigabytes(24)
    });
  });

  it("falls back to the active vram key when the plain one is absent", () => {
    const output = JSON.stringify({
      SPDisplaysDataType: [
        { sppci_model: "Apple M2", _spdisplays_vramActive: "Shared" }
      ]
    });
    expect(parseMacosGraphicsCard(output)).toEqual({
      graphicsCardName: "Apple M2",
      videoMemoryBytes: null
    });
  });

  it("survives output that is not the shape we expect", () => {
    expect(parseMacosGraphicsCard("not json")).toEqual({
      graphicsCardName: "Unknown",
      videoMemoryBytes: null
    });
    expect(parseMacosGraphicsCard("{}")).toEqual({
      graphicsCardName: "Unknown",
      videoMemoryBytes: null
    });
  });
});

describe("describeGigabytes", () => {
  it("rounds to whole gigabytes and names shared memory", () => {
    expect(describeGigabytes(gigabytes(64))).toBe("64 GB");
    expect(describeGigabytes(null)).toBe("Shared");
  });
});

describe("buildHardwareReport", () => {
  it("assembles the labels the wizard shows", () => {
    expect(
      buildHardwareReport({
        graphicsCardName: "NVIDIA GeForce RTX 4090",
        videoMemoryBytes: gigabytes(24),
        systemMemoryBytes: gigabytes(64)
      })
    ).toEqual({
      graphicsCardName: "NVIDIA GeForce RTX 4090",
      videoMemoryLabel: "24 GB",
      systemMemoryLabel: "64 GB",
      verdict: "ready"
    });
  });
});
