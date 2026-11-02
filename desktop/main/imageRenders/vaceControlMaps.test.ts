import { describe, expect, it } from "vitest";

import {
  ComfyWanVaceClient,
  VACE_DEPTH_CHECKPOINT,
  VACE_DEPTH_RESOLUTION,
  VACE_POSE_RESOLUTION
} from "./comfyWanAnimateClient";
import { readBoundedSetting, VACE_SETTING_BOUNDS } from "./imageRenderService";

type VaceGraphBuilder = {
  buildVaceGraph(input: {
    video: string;
    referenceImage: string;
    prompt: string;
    frameCount: number;
    variant: "14b_fp8" | "1.3b_fp16";
    width: number;
    height: number;
    depthStrength: number;
    poseStrength: number;
    seed: number;
  }): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

const buildGraph = (
  overrides: Partial<Parameters<VaceGraphBuilder["buildVaceGraph"]>[0]> = {}
) => {
  const client = new ComfyWanVaceClient("http://127.0.0.1:8188");
  return (client as unknown as VaceGraphBuilder).buildVaceGraph({
    video: "mago/control.mp4",
    referenceImage: "mago/reference.png",
    prompt: "restyle the video",
    frameCount: 49,
    variant: "14b_fp8",
    width: 832,
    height: 480,
    depthStrength: 0.5,
    poseStrength: 0.5,
    seed: 456,
    ...overrides
  });
};

describe("VACE control maps", () => {
  it("never feeds the raw source frames to either control entry", () => {
    const graph = buildGraph();
    const controlSources = Object.values(graph)
      .filter((node) => node.class_type === "WanVaceToVideo")
      .map((node) => node.inputs.control_video);
    expect(controlSources).toHaveLength(2);
    for (const source of controlSources) {
      expect(source).not.toEqual(["2", 0]);
    }
  });

  it("derives a depth map and a pose map from the source video", () => {
    const graph = buildGraph();
    expect(graph["15"]).toMatchObject({
      class_type: "DepthAnythingV2Preprocessor",
      inputs: {
        image: ["2", 0],
        ckpt_name: VACE_DEPTH_CHECKPOINT,
        resolution: VACE_DEPTH_RESOLUTION
      }
    });
    expect(graph["16"]).toMatchObject({
      class_type: "DWPreprocessor",
      inputs: { image: ["2", 0], resolution: VACE_POSE_RESOLUTION }
    });
  });

  it("chains the pose entry onto the depth entry's conditioning", () => {
    const graph = buildGraph({ depthStrength: 0.4, poseStrength: 0.7 });
    expect(graph["10"].inputs).toMatchObject({
      control_video: ["15", 0],
      strength: 0.4,
      positive: ["7", 0],
      negative: ["8", 0]
    });
    expect(graph["17"].inputs).toMatchObject({
      control_video: ["16", 0],
      strength: 0.7,
      positive: ["10", 0],
      negative: ["10", 1]
    });
  });

  it("gives both entries the same reference image, so their latents line up", () => {
    const graph = buildGraph();
    expect(graph["10"].inputs.reference_image).toEqual(["3", 0]);
    expect(graph["17"].inputs.reference_image).toEqual(["3", 0]);
  });

  it("samples and trims from the last entry in the chain", () => {
    const graph = buildGraph();
    expect(graph["11"].inputs).toMatchObject({
      positive: ["17", 0],
      negative: ["17", 1],
      latent_image: ["17", 2]
    });
    expect(graph["12"].inputs).toMatchObject({
      trim_amount: ["17", 3],
      samples: ["11", 0]
    });
  });

  it("keeps the source audio and fps, and saves through the polled node id", () => {
    const graph = buildGraph();
    expect(graph["14"].inputs).toMatchObject({
      fps: ["2", 2],
      audio: ["2", 1]
    });
    expect(graph["19"].class_type).toBe("SaveVideo");
  });
});

describe("VACE_SETTING_BOUNDS", () => {
  it("defaults both control maps to the production strength", () => {
    expect(VACE_SETTING_BOUNDS.depthStrength.fallback).toBe(0.5);
    expect(VACE_SETTING_BOUNDS.poseStrength.fallback).toBe(0.5);
  });

  it("clamps and falls back like the other settings", () => {
    expect(readBoundedSetting(9, VACE_SETTING_BOUNDS.poseStrength)).toBe(1);
    expect(
      readBoundedSetting(undefined, VACE_SETTING_BOUNDS.depthStrength)
    ).toBe(0.5);
  });
});
