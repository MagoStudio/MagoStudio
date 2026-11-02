import { describe, expect, it } from "vitest";

import type { MiniMaxH3VfxMode } from "../../shared/minimaxH3VfxModes";

import { planMiniMaxH3Render } from "./comfyMiniMaxH3Client";

const plannedPrompt = ({
  vfxMode,
  useReferenceVideoAudio,
  hasSourceVideo = true
}: {
  vfxMode: MiniMaxH3VfxMode;
  useReferenceVideoAudio: boolean;
  hasSourceVideo?: boolean;
}) =>
  planMiniMaxH3Render({
    prompt: "<Video 1> sings, keep <Audio 1>",
    width: 736,
    height: 1280,
    durationSeconds: 3,
    quality: "high",
    referenceImagePaths: ["reference.png"],
    referenceVideoPath: hasSourceVideo ? "source.mp4" : undefined,
    useReferenceVideoAudio,
    seed: 1,
    vfxMode,
    isEditedFrameProvided: false,
    vfxLoraStrength: 1
  }).prompt;

describe("planMiniMaxH3Render audio tags", () => {
  it("keeps <Audio 1> when the source soundtrack is a reference", () => {
    expect(
      plannedPrompt({ vfxMode: "none", useReferenceVideoAudio: true })
    ).toBe("<Video 1> sings, keep <Audio 1>");
  });

  it("names the guided soundtrack in a guide task", () => {
    expect(
      plannedPrompt({ vfxMode: "head_swap", useReferenceVideoAudio: true })
    ).toBe("head_swap: the source video sings, keep the source soundtrack");
  });

  it("names an unwired soundtrack in words in a guide task", () => {
    expect(
      plannedPrompt({ vfxMode: "head_swap", useReferenceVideoAudio: false })
    ).toBe("head_swap: the source video sings, keep the soundtrack");
  });

  it("names an unwired soundtrack in words in a plain render", () => {
    expect(
      plannedPrompt({ vfxMode: "none", useReferenceVideoAudio: false })
    ).toBe("<Video 1> sings, keep the soundtrack");
  });

  it("names the soundtrack in words when no source video is used", () => {
    expect(
      plannedPrompt({
        vfxMode: "none",
        useReferenceVideoAudio: true,
        hasSourceVideo: false
      })
    ).toBe("<Video 1> sings, keep the soundtrack");
  });
});

const planRequest = {
  prompt: "vfx_edit: make it rain",
  width: 736,
  height: 1280,
  durationSeconds: 3,
  quality: "high" as const,
  referenceImagePaths: [],
  referenceVideoPath: "source.mp4",
  useReferenceVideoAudio: false,
  seed: 1,
  vfxMode: "vfx_edit" as const,
  isEditedFrameProvided: true,
  vfxLoraStrength: 1
};

describe("planMiniMaxH3Render missing inputs", () => {
  it("refuses the edited-frame LoRA when the edited frame image is missing", () => {
    expect(() => planMiniMaxH3Render(planRequest)).toThrow(
      "The edited frame image is missing. Add the edited frame again"
    );
  });

  it("uses the edited-frame LoRA when the edited frame image is there", () => {
    expect(
      planMiniMaxH3Render({
        ...planRequest,
        referenceImagePaths: ["edited.png"]
      }).vfxLora?.lora.loraFile
    ).toBe("minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors");
  });

  it("asks for a source video or a reference image when it has neither", () => {
    expect(() =>
      planMiniMaxH3Render({
        ...planRequest,
        vfxMode: "none",
        isEditedFrameProvided: false,
        referenceVideoPath: undefined
      })
    ).toThrow("MiniMax H3 needs a source video or a reference image");
  });
});
