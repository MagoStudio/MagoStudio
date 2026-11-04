import { describe, expect, it } from "vitest";

import type { ScriptSetupStatus } from "../../shared/contracts";

import { applyRequiredComfyVersion } from "./applyRequiredComfyVersion";

const readyStatus: ScriptSetupStatus = {
  ready: true,
  nodes: [],
  models: [],
  optionalStepLoras: [],
  vfxLoras: [],
  optional: []
};
const statsReporting = (comfyuiVersion: string) => ({
  system: { comfyui_version: comfyuiVersion }
});

describe("applyRequiredComfyVersion", () => {
  it("accepts any ComfyUI when no version is required", () => {
    expect(
      applyRequiredComfyVersion(readyStatus, statsReporting("0.1.0"), "")
    ).toBe(readyStatus);
  });

  it("accepts the required version and newer ones", () => {
    for (const reported of ["0.38.0", "0.38.2", "1.0.0"]) {
      const result = applyRequiredComfyVersion(
        readyStatus,
        statsReporting(reported),
        "0.38.0"
      );
      expect(result.ready).toBe(true);
      expect(result.nodes[0]).toMatchObject({
        name: "ComfyUI 0.38.0 or later",
        status: "installed"
      });
    }
  });

  it("marks an older ComfyUI as missing and not ready", () => {
    const result = applyRequiredComfyVersion(
      readyStatus,
      statsReporting("0.37.9"),
      "0.38.0"
    );
    expect(result.ready).toBe(false);
    expect(result.nodes[0].status).toBe("missing");
  });

  it("reports an unknown version without blocking", () => {
    for (const systemStats of [null, { system: {} }]) {
      const result = applyRequiredComfyVersion(
        readyStatus,
        systemStats,
        "0.38.0"
      );
      expect(result.ready).toBe(true);
      expect(result.nodes[0].status).toBe("unknown");
    }
  });
});
