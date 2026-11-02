import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotVideoSettings } from "./resolveBulkRendersRunShotVideoSettings";

describe("resolveBulkRendersRunShotVideoSettings", () => {
  it("falls back to the run level settings when the Shot has no override", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { prompt: "run prompt" },
      shotOverridesById: {}
    });

    expect(settings.prompt).toBe("run prompt");
    expect(settings.isOverridden).toBe(false);
  });

  it("prefers the Shot override over the run level settings", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { prompt: "run prompt" },
      shotOverridesById: {
        "shot-1": {
          video_settings: { prompt: "shot prompt" }
        }
      }
    });

    expect(settings.prompt).toBe("shot prompt");
  });

  it("reads the overridden prompt when the Shot supplies one", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { prompt: "run prompt" },
      shotOverridesById: {
        "shot-1": { video_settings: { prompt: "shot prompt" } }
      }
    });

    expect(settings.prompt).toBe("shot prompt");
  });

  it("ignores another Shot's override", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { prompt: "run prompt" },
      shotOverridesById: {
        "shot-2": { video_settings: { prompt: "other prompt" } }
      }
    });

    expect(settings.prompt).toBe("run prompt");
  });

  it("is all undefined when the run detail has not loaded", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: undefined,
      shotOverridesById: undefined
    });

    expect(settings.prompt).toBeUndefined();
    expect(settings.engine).toBeUndefined();
    expect(settings.isOverridden).toBe(false);
  });

  it("does not read the Image settings of the same Shot override", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: undefined,
      shotOverridesById: {
        "shot-1": { img2img_settings: { prompt: "image prompt" } }
      }
    });

    expect(settings.prompt).toBeUndefined();
  });

  it("resolves the engine from the Shot's own override alone, never inferring it from other keys", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { engine: VideoEngine.V3_4_0 },
      shotOverridesById: {
        "shot-1": { video_settings: { engine: VideoEngine.kling_o1 } }
      }
    });

    expect(settings.engine).toBe(VideoEngine.kling_o1);
  });

  it("falls back to the run level engine when the Shot carries no engine override", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { engine: VideoEngine.V3_4_0 },
      shotOverridesById: {
        "shot-1": { video_settings: { steps: 30 } }
      }
    });

    expect(settings.engine).toBe(VideoEngine.V3_4_0);
  });

  it("is not overridden when the Shot's only override is its prompt", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: {},
      shotOverridesById: {
        "shot-1": { video_settings: { prompt: "shot prompt" } }
      }
    });

    expect(settings.isOverridden).toBe(false);
  });

  it("is overridden when the Shot carries a settings-patch key other than the prompt", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: {},
      shotOverridesById: {
        "shot-1": { video_settings: { steps: 30 } }
      }
    });

    expect(settings.isOverridden).toBe(true);
  });

  it("is not overridden when the Shot's only override is its own full frame_range", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: {},
      shotOverridesById: {
        "shot-1": { video_settings: { frame_range: [0, 40] } }
      }
    });

    expect(settings.isOverridden).toBe(false);
  });

  it("is not overridden when the Shot's override carries only frame_range and prompt", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: {},
      shotOverridesById: {
        "shot-1": {
          video_settings: { frame_range: [0, 40], prompt: "shot prompt" }
        }
      }
    });

    expect(settings.isOverridden).toBe(false);
  });

  it("is overridden when the Shot carries an engine override, even with no other settings key", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: {},
      shotOverridesById: {
        "shot-1": { video_settings: { engine: VideoEngine.kling_o1 } }
      }
    });

    expect(settings.isOverridden).toBe(true);
  });

  it("merges the run level and Shot override settings into one values object for the panel", () => {
    const settings = resolveBulkRendersRunShotVideoSettings({
      shotId: "shot-1",
      runVideoSettings: { steps: 20, denoise: 0.5 },
      shotOverridesById: {
        "shot-1": { video_settings: { steps: 30 } }
      }
    });

    expect(settings.values).toEqual({ steps: 30, denoise: 0.5 });
  });
});
