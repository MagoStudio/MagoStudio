import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ComfyWanAnimateClient,
  ComfyWanVaceClient,
  WAN_ANIMATE_MODEL_FILES,
  WAN_VACE_MODEL_FILES,
  type WanAnimateMode
} from "./comfyWanAnimateClient";

type GraphBuilder = {
  buildGraph(input: {
    video: string;
    referenceImage: string;
    prompt: string;
    mode: WanAnimateMode;
    frameCount: number;
    width: number;
    height: number;
    seed: number;
  }): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

const build = (
  mode: WanAnimateMode,
  dimensions: { width: number; height: number } = { width: 1920, height: 1080 }
) => {
  const client = new ComfyWanAnimateClient("http://127.0.0.1:8188");
  return (client as unknown as GraphBuilder).buildGraph({
    video: "mago/input.mp4",
    referenceImage: "mago/reference.png",
    prompt: "replace the character",
    mode,
    frameCount: 49,
    width: dimensions.width,
    height: dimensions.height,
    seed: 123
  });
};

describe("ComfyWanAnimateClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("builds the official Wan2.2 Animate motion graph", () => {
    const graph = build("move");

    expect(graph["20"].inputs.unet_name).toBe(WAN_ANIMATE_MODEL_FILES.unet);
    expect(graph["145"]).toMatchObject({
      class_type: "LoadVideo",
      inputs: { file: "mago/input.mp4" }
    });
    expect(graph["10"].inputs.image).toBe("mago/reference.png");
    expect(graph["232:62"]).toMatchObject({
      class_type: "WanAnimateToVideo",
      inputs: {
        length: 49,
        reference_image: ["10", 0],
        pose_video: ["100", 0],
        face_video: ["101", 0]
      }
    });
    expect(graph["232:63"].inputs).toMatchObject({ seed: 123, steps: 6 });
    expect(graph["232:15"].inputs.fps).toEqual(["23", 2]);
    expect(graph["19"].class_type).toBe("SaveVideo");
    expect(graph["107"]).toBeUndefined();
  });

  it("pads a non-square input up to a multiple of 16 for generation", () => {
    const graph = build("move", { width: 1920, height: 1080 });

    expect(graph["159"].inputs.value).toBe(1920);
    expect(graph["160"].inputs.value).toBe(1088);
    expect(graph["232:15"].inputs.images).toEqual(["232:230", 0]);
  });

  it("adds the official SAM2 subject mask branch for Mix mode", () => {
    const graph = build("mix", { width: 1920, height: 1080 });

    expect(graph["108"].class_type).toBe("DownloadAndLoadSAM2Model");
    expect(graph["107"].class_type).toBe("Sam2Segmentation");
    expect(graph["232:62"].inputs).toMatchObject({
      background_video: ["275", 0],
      character_mask: ["276", 0]
    });
    expect(graph["229"].inputs).toMatchObject({
      width: 1920,
      height: 1088,
      coordinates: '[{"x":960,"y":540}]'
    });
  });

  it("reports a prompt lost by a ComfyUI restart instead of leaving it queued", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(
        Response.json({ queue_running: [], queue_pending: [] })
      )
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ComfyWanAnimateClient("http://127.0.0.1:8188").poll(
        "lost-prompt",
        "/tmp/unused-output.mp4"
      )
    ).resolves.toEqual({
      state: "error",
      message:
        "ComfyUI no longer has this render. ComfyUI may have restarted; start the render again."
    });
  });
});

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

describe("ComfyWanVaceClient", () => {
  it("builds the official VACE graph with video, reference, audio, and source fps", () => {
    const client = new ComfyWanVaceClient("http://127.0.0.1:8188");
    const graph = (client as unknown as VaceGraphBuilder).buildVaceGraph({
      video: "mago/control.mp4",
      referenceImage: "mago/reference.png",
      prompt: "restyle the video",
      frameCount: 49,
      variant: "14b_fp8",
      width: 832,
      height: 480,
      depthStrength: 0.5,
      poseStrength: 0.5,
      seed: 456
    });

    expect(graph["4"].inputs.unet_name).toBe(WAN_VACE_MODEL_FILES.unet14bFp8);
    expect(graph["10"]).toMatchObject({
      class_type: "WanVaceToVideo",
      inputs: {
        width: 832,
        height: 480,
        length: 49,
        strength: 0.5,
        control_video: ["15", 0],
        reference_image: ["3", 0]
      }
    });
    expect(graph["11"].inputs).toMatchObject({ seed: 456, steps: 20, cfg: 6 });
    expect(graph["14"].inputs).toMatchObject({
      fps: ["2", 2],
      images: ["13", 0],
      audio: ["2", 1]
    });
    expect(graph["19"].class_type).toBe("SaveVideo");
  });

  it("pads a non-multiple-of-16 input up to a multiple of 16 for generation", () => {
    const client = new ComfyWanVaceClient("http://127.0.0.1:8188");
    const graph = (client as unknown as VaceGraphBuilder).buildVaceGraph({
      video: "mago/control.mp4",
      referenceImage: "mago/reference.png",
      prompt: "restyle the video",
      frameCount: 49,
      variant: "14b_fp8",
      width: 850,
      height: 480,
      depthStrength: 0.5,
      poseStrength: 0.5,
      seed: 456
    });

    expect(graph["10"]).toMatchObject({ inputs: { width: 864, height: 480 } });
  });

  it("selects the lightweight 1.3B FP16 checkpoint", () => {
    const client = new ComfyWanVaceClient("http://127.0.0.1:8188");
    const graph = (client as unknown as VaceGraphBuilder).buildVaceGraph({
      video: "mago/control.mp4",
      referenceImage: "mago/reference.png",
      prompt: "restyle",
      frameCount: 49,
      variant: "1.3b_fp16",
      width: 832,
      height: 480,
      depthStrength: 0.5,
      poseStrength: 0.5,
      seed: 1
    });

    expect(graph["4"].inputs.unet_name).toBe(WAN_VACE_MODEL_FILES.unet1_3bFp16);
  });
});
