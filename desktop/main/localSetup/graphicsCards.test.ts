import { describe, expect, it } from "vitest";

import {
  buildMultiGpuReport,
  mergeGraphicsCards,
  parseNvidiaCards,
  parseWindowsCards
} from "./graphicsCards";
import { BYTES_PER_GIGABYTE as GB } from "./resolveHardwareVerdict";
describe("multiple GPU detection", () => {
  it("reads every NVIDIA device including MiB values above 4 GB", () => {
    const cards = parseNvidiaCards(
      "NVIDIA RTX 3080, 10240\nNVIDIA GeForce RTX 5090, 32607\n"
    );
    const report = buildMultiGpuReport(cards, 64 * GB);
    expect(report.graphicsCardName).toBe("NVIDIA GeForce RTX 5090");
    expect(report.videoMemoryLabel).toBe("32 GB");
    expect(report.verdict).toBe("ready");
    expect(report.graphicsCards).toHaveLength(2);
    expect(report.graphicsCards?.filter((card) => card.selected)).toHaveLength(
      1
    );
    expect(
      parseNvidiaCards("NVIDIA RTX 4090, 24576 MiB")[0].videoMemoryBytes
    ).toBe(24 * GB);
  });
  it("ignores CIM AdapterRAM instead of reporting its truncated value", () => {
    expect(
      parseWindowsCards(
        JSON.stringify({ Name: "NVIDIA RTX 5090", AdapterRAM: 4293918720 })
      )[0].videoMemoryBytes
    ).toBeNull();
    expect(
      parseWindowsCards(
        JSON.stringify({ Name: "NVIDIA RTX 5090", DedicatedBytes: 32 * GB })
      )[0].videoMemoryBytes
    ).toBe(32 * GB);
  });
  it("excludes integrated GPUs but keeps Intel Arc discrete GPUs", () => {
    const report = buildMultiGpuReport(
      parseWindowsCards(
        JSON.stringify([
          { Name: "Intel(R) UHD Graphics", DedicatedBytes: null },
          {
            Name: "AMD Radeon(TM) Graphics",
            DedicatedBytes: 512 * 1024 * 1024
          },
          { Name: "Intel Arc A770", DedicatedBytes: 16 * GB },
          { Name: "NVIDIA RTX 5090", DedicatedBytes: 32 * GB }
        ])
      ),
      64 * GB
    );
    expect(report.skippedSharedGpuCount).toBe(2);
    expect(report.graphicsCards?.map((card) => card.name)).toEqual([
      "NVIDIA RTX 5090",
      "Intel Arc A770"
    ]);
  });
  it("preserves two identical physical GPUs when merging fallback data", () => {
    const primary = parseNvidiaCards(
      "NVIDIA RTX 4090, 24576\nNVIDIA RTX 4090, 24576"
    );
    const fallback = parseWindowsCards(
      JSON.stringify([{ Name: "NVIDIA RTX 4090" }, { Name: "NVIDIA RTX 4090" }])
    );
    expect(mergeGraphicsCards(primary, fallback)).toHaveLength(2);
  });
  it("does not label unknown VRAM as shared RAM", () => {
    const result = buildMultiGpuReport(
      [{ graphicsCardName: "NVIDIA RTX 5090", videoMemoryBytes: null }],
      64 * GB
    );
    expect(result.videoMemoryLabel).toBe("Unknown");
    expect(result.graphicsCards).toHaveLength(1);
    expect(result.verdict).toBe("blocked");
  });
});
