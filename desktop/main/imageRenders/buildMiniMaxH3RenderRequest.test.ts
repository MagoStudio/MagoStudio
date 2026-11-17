import { describe, expect, it } from "vitest";

import { buildMiniMaxH3RenderRequest } from "./buildMiniMaxH3RenderRequest";

describe("buildMiniMaxH3RenderRequest", () => {
  it("reads the panel settings into a render request", () => {
    expect(
      buildMiniMaxH3RenderRequest({
        settings: {
          prompt: "add fire",
          width: 720,
          height: 1280,
          h3_quality: "medium",
          use_video_audio: false,
          seed: 9,
          vfx_mode: "vfx_edit",
          vfx_edited_frame_id: "edited",
          vfx_lora_strength: 5
        },
        durationSeconds: 5,
        referenceImagePaths: ["edited.png"],
        sourceVideoPath: "source.mp4",
        doesSourceVideoHaveAudio: true
      })
    ).toEqual({
      prompt: "add fire",
      width: 720,
      height: 1280,
      durationSeconds: 5,
      quality: "medium",
      referenceImagePaths: ["edited.png"],
      referenceVideoPath: "source.mp4",
      useReferenceVideoAudio: false,
      seed: 9,
      vfxMode: "vfx_edit",
      isEditedFrameProvided: true,
      vfxLoraStrength: 2,
      crossviewCamera: { azimuthDegrees: 30, elevationDegrees: 0 }
    });
  });

  it("never asks for the soundtrack of a silent source video", () => {
    expect(
      buildMiniMaxH3RenderRequest({
        settings: { use_video_audio: true },
        durationSeconds: 5,
        referenceImagePaths: [],
        sourceVideoPath: "silent.mp4",
        doesSourceVideoHaveAudio: false
      }).useReferenceVideoAudio
    ).toBe(false);
  });

  it("never sends the source soundtrack to a new camera angle", () => {
    expect(
      buildMiniMaxH3RenderRequest({
        settings: { vfx_mode: "crossview", use_video_audio: true },
        durationSeconds: 5,
        referenceImagePaths: [],
        sourceVideoPath: "source.mp4",
        doesSourceVideoHaveAudio: true
      }).useReferenceVideoAudio
    ).toBe(false);
  });

  it("always sends the source video, even with a stale saved switch", () => {
    expect(
      buildMiniMaxH3RenderRequest({
        settings: { use_video_reference: false },
        durationSeconds: 5,
        referenceImagePaths: [],
        sourceVideoPath: "source.mp4",
        doesSourceVideoHaveAudio: true
      }).referenceVideoPath
    ).toBe("source.mp4");
  });

  it("reads the crossview camera and strength, clamped to their ranges", () => {
    const request = buildMiniMaxH3RenderRequest({
      settings: {
        vfx_mode: "crossview",
        crossview_azimuth: -120,
        crossview_elevation: 20,
        vfx_lora_strength: 1.5
      },
      durationSeconds: 3,
      referenceImagePaths: [],
      sourceVideoPath: "source.mp4",
      doesSourceVideoHaveAudio: false
    });
    expect(request.crossviewCamera).toEqual({
      azimuthDegrees: -90,
      elevationDegrees: 20
    });
    expect(request.vfxLoraStrength).toBe(0.8);
  });
});
