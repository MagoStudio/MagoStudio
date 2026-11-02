import { RenderMode } from "@hooks/types";
import { klingO1Model } from "@models/video/klingO1Model";
import { minimaxReferenceVideoModel } from "@models/video/minimaxReferenceVideoModel";
import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildRenderPayload } from "./buildRenderPayload";

const baseInput = {
  parentLayerId: "layer-1",
  frameRange: [0, 120],
  inputTrackId: "video-1",
  renderEngine: "magov2",
  renderMode: RenderMode.CREDITS,
  model: minimaxReferenceVideoModel,
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  fps: 24
};

const baseSettings = {
  mago_engine: VideoEngine.minimax_reference,
  prompt: "A hero walks through the city",
  use_video_audio: true,
  max_size: 1280,
  seed: 42,
  save_exr: false
};

describe("MiniMax Reference (v9.1.0) — use_video_reference gates sources.video", () => {
  it("sends the shot's source video as sources.video when use_video_reference is true", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [{ asset_id: "ref-1", type: "reference_frame" }],
      renderSettings: { ...baseSettings, use_video_reference: true }
    });

    expect(result.sources).toEqual({
      video: "video-1",
      images: [{ asset_id: "ref-1", type: "reference_frame" }]
    });
  });

  it("defaults to sending the source video when use_video_reference is absent", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings }
    });

    expect(result.sources).toEqual({ video: "video-1" });
  });

  it("omits sources.video but keeps reference images when use_video_reference is false", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [{ asset_id: "ref-1", type: "reference_frame" }],
      renderSettings: { ...baseSettings, use_video_reference: false }
    });

    expect(result.sources).toEqual({
      images: [{ asset_id: "ref-1", type: "reference_frame" }]
    });
    expect("video" in result.sources).toBe(false);
  });

  it("produces a reference-free payload (no video, no images) for a prompt-only render", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings, use_video_reference: false }
    });

    expect(result.sources).toEqual({});
  });
});

describe("MiniMax Reference (v9.1.0) — wire settings", () => {
  it("ships the v9.1.0 keys the backend accepts and none it rejects", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings, use_video_reference: true }
    });

    const magov2 = result.render_settings.magov2;
    expect(magov2.mago_engine).toBe(VideoEngine.minimax_reference);
    expect(magov2.prompt).toBe("A hero walks through the city");
    expect(magov2.max_size).toBe(1280);
    expect(magov2.use_video_audio).toBe(true);
    expect(magov2.save_exr).toBe(false);
  });

  it("strips use_video_reference — its only job is to gate sources.video, and the backend does not accept it", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings, use_video_reference: true }
    });

    expect("use_video_reference" in result.render_settings.magov2).toBe(false);
  });
});

describe("use_video_reference does not leak across engines", () => {
  it("keeps sources.video for a model that does not declare the toggle, even with a stale use_video_reference: false", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: klingO1Model,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.kling_o1,
        prompt: "Change the video to match @Image1 style",
        use_video_reference: false
      }
    });

    expect(result.sources).toEqual({ video: "video-1" });
  });
});

describe("MiniMax Reference (v9.1.0) — a setting the user hid does not reach the wire", () => {
  it("drops use_video_audio when use_video_reference is off", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings, use_video_reference: false }
    });

    expect("use_video_audio" in result.render_settings.magov2).toBe(false);
  });

  it("keeps use_video_audio when use_video_reference is on", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: { ...baseSettings, use_video_reference: true }
    });

    expect(result.render_settings.magov2.use_video_audio).toBe(true);
  });
});
