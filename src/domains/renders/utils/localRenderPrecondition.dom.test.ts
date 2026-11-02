import { VideoEngine } from "@models/video/types";
import { afterEach, describe, expect, it } from "vitest";

import {
  imageRenderPrecondition,
  videoRenderPrecondition
} from "./localRenderPrecondition";

const local = { isLocalApp: true };

const setBridge = (value: unknown) => {
  Object.defineProperty(window, "mago", {
    value,
    configurable: true,
    writable: true
  });
};

afterEach(() => setBridge(undefined));

describe("videoRenderPrecondition", () => {
  it("asks for nothing before a cloud render", () => {
    // The bug this prevents: a cloud render was asked for a fal API key, so
    // pressing Generate opened the credentials modal instead of submitting.
    for (const model of [
      VideoEngine.V8_0_0,
      VideoEngine.V7_0_0,
      VideoEngine.V5_0_0,
      VideoEngine.v1_0_0_upscaler
    ]) {
      expect(videoRenderPrecondition(model, local)).toBe("none");
    }
  });

  it("asks for a Comfy endpoint before a Comfy model", () => {
    for (const model of [
      VideoEngine.wan_animate_2_2,
      VideoEngine.wan_vace_2_1,
      VideoEngine.mago_style_transfer_local,
      VideoEngine.mago_animate,
      VideoEngine.ltx_2_3_spatial_upscaler
    ]) {
      expect(videoRenderPrecondition(model, local)).toBe("comfy");
    }
  });

  it("asks for nothing before a third-party model, which now prefers the cloud", () => {
    // These run on Mago credits by default, so no fal key of the user's own.
    for (const model of [
      VideoEngine.seedance_2,
      VideoEngine.happy_horse_1,
      VideoEngine.kling_o1
    ]) {
      expect(videoRenderPrecondition(model, local)).toBe("none");
    }
  });

  it("asks for nothing outside the desktop app", () => {
    expect(
      videoRenderPrecondition(VideoEngine.seedance_2, { isLocalApp: false })
    ).toBe("none");
  });

  it("treats an unknown model as cloud, so it demands nothing local", () => {
    expect(videoRenderPrecondition("brand_new_model", local)).toBe("none");
    expect(videoRenderPrecondition(undefined, local)).toBe("none");
  });
});

describe("imageRenderPrecondition", () => {
  it("asks for nothing before a cloud image render", () => {
    expect(imageRenderPrecondition("mago", local)).toBe("none");
    expect(imageRenderPrecondition("kontext", local)).toBe("none");
  });

  it("asks for a Comfy endpoint before qwen", () => {
    expect(imageRenderPrecondition("qwen", local)).toBe("comfy");
  });

  it("never requests personal keys for cloud images, even offline", () => {
    // Only once they are actually routed to fal: signed in with Mago cloud on,
    // these run on Mago's renderers and need no key of the user's own, which is
    // what `imageRenderTarget` reports and this precondition follows.
    setBridge({ account: { mode: "offline" } });
    for (const model of ["nanobanana_pro", "seedream_5_pro", "gpt_image_2"]) {
      expect(imageRenderPrecondition(model, local)).toBe("none");
    }
  });

  it("asks for nothing once a fal image model is routed to Mago cloud", () => {
    setBridge({ account: { mode: "cloud" } });
    for (const model of ["nanobanana_pro", "seedream_5_pro", "gpt_image_2"]) {
      expect(imageRenderPrecondition(model, local)).toBe("none");
    }
  });

  it("asks for nothing outside the desktop app", () => {
    expect(imageRenderPrecondition("qwen", { isLocalApp: false })).toBe("none");
  });
});
