import { VideoEngine } from "@models/video/types";
import { afterEach, describe, expect, it } from "vitest";

import {
  CLOUD_SUBMISSION_FROM_DESKTOP,
  cloudUnavailableReason,
  imageRenderTarget,
  isCloudRenderAvailable,
  isImageModelAvailable,
  isRenderTargetAvailable,
  isVideoModelAvailable,
  videoRenderTarget
} from "./renderTarget";

const setBridge = (value: unknown) => {
  Object.defineProperty(window, "mago", {
    value,
    configurable: true,
    writable: true
  });
};

afterEach(() => setBridge(undefined));

const ALL_ENABLED = {
  "local-comfy": true,
  "mago-cloud": true
};
const CLOUD_OFF = { ...ALL_ENABLED, "mago-cloud": false };

describe("videoRenderTarget", () => {
  it("always runs the Comfy models on this machine, cloud or not", () => {
    for (const model of [
      VideoEngine.wan_animate_2_2,
      VideoEngine.wan_vace_2_1,
      VideoEngine.mago_animate,
      VideoEngine.mago_style_transfer_local
    ]) {
      expect(videoRenderTarget(model, true, ALL_ENABLED)).toBe("local");
      expect(videoRenderTarget(model, false, ALL_ENABLED)).toBe("local");
    }
  });

  it("prefers Mago cloud for the third-party models, so no fal key is needed", () => {
    for (const model of [
      VideoEngine.seedance_2,
      VideoEngine.happy_horse_1,
      VideoEngine.kling_o1,
      VideoEngine.kling_o3_edit_pro
    ]) {
      expect(videoRenderTarget(model, true, ALL_ENABLED)).toBe("cloud");
    }
  });

  it("keeps third-party models cloud-only when cloud is switched off", () => {
    // Turning off Mago cloud in settings is the only way to choose fal directly.
    expect(videoRenderTarget(VideoEngine.seedance_2, true, CLOUD_OFF)).toBe(
      "cloud"
    );
  });

  it("keeps third-party models cloud-only offline", () => {
    expect(videoRenderTarget(VideoEngine.seedance_2, false, ALL_ENABLED)).toBe(
      "cloud"
    );
  });

  it("routes Mago's own models to the cloud", () => {
    for (const model of [
      VideoEngine.V8_0_0,
      VideoEngine.V7_0_0,
      VideoEngine.V5_0_0,
      VideoEngine.V4_1_0,
      VideoEngine.v1_0_0_upscaler,
      VideoEngine.v2_0_0_esrgan_upscaler,
      VideoEngine.v1_0_0_mask,
      VideoEngine.V5_1_0
    ]) {
      expect(videoRenderTarget(model)).toBe("cloud");
    }
  });

  it("treats an unknown model as cloud rather than silently running it locally", () => {
    expect(videoRenderTarget("something_new")).toBe("cloud");
    expect(videoRenderTarget(undefined)).toBe("cloud");
  });
});

describe("imageRenderTarget", () => {
  it("always runs the Comfy image model on this machine, cloud or not", () => {
    expect(imageRenderTarget("qwen", true, ALL_ENABLED)).toBe("local");
    expect(imageRenderTarget("qwen", false, ALL_ENABLED)).toBe("local");
  });

  it("prefers Mago cloud for the fal image models, so no fal key is needed", () => {
    for (const model of ["nanobanana_pro", "seedream_5_pro", "gpt_image_2"]) {
      expect(imageRenderTarget(model, true, ALL_ENABLED)).toBe("cloud");
    }
  });

  it("keeps cloud image models routed to cloud offline", () => {
    for (const model of ["nanobanana_pro", "seedream_5_pro", "gpt_image_2"]) {
      expect(imageRenderTarget(model, false, ALL_ENABLED)).toBe("cloud");
    }
  });

  it("keeps image models cloud-only when cloud is switched off", () => {
    for (const model of ["nanobanana_pro", "seedream_5_pro", "gpt_image_2"]) {
      expect(imageRenderTarget(model, true, CLOUD_OFF)).toBe("cloud");
    }
  });

  it("routes anything else to the cloud", () => {
    expect(imageRenderTarget("mago")).toBe("cloud");
    expect(imageRenderTarget("kontext")).toBe("cloud");
  });
});

describe("isCloudRenderAvailable", () => {
  it("is available outside the desktop shell, where offline is not an option", () => {
    // The cloud web app, unit tests and Storybook all land here.
    setBridge(undefined);
    expect(isCloudRenderAvailable()).toBe(true);
  });

  it("is unavailable in the desktop shell until cloud submission is implemented", () => {
    // Signed in is necessary but not sufficient: submitting would reference
    // local ids the cloud has never seen until the project mirror lands.
    setBridge({ account: { mode: "cloud" } });
    expect(isCloudRenderAvailable()).toBe(CLOUD_SUBMISSION_FROM_DESKTOP);

    setBridge({ account: { mode: "offline" } });
    expect(isCloudRenderAvailable()).toBe(false);

    setBridge({ account: { mode: "unchosen" } });
    expect(isCloudRenderAvailable()).toBe(false);
  });
});

describe("cloudUnavailableReason", () => {
  it("distinguishes not signed in from not yet supported", () => {
    setBridge({ account: { mode: "offline" } });
    expect(cloudUnavailableReason()).toBe("signed-out");

    setBridge({ account: { mode: "cloud" } });
    expect(cloudUnavailableReason()).toBe(
      CLOUD_SUBMISSION_FROM_DESKTOP ? null : "not-implemented"
    );
  });

  it("has no reason to give outside the desktop shell", () => {
    setBridge(undefined);
    expect(cloudUnavailableReason()).toBeNull();
  });
});

describe("isRenderTargetAvailable", () => {
  it("allows local renders whether or not the cloud is reachable", () => {
    expect(isRenderTargetAvailable("local", false)).toBe(true);
    expect(isRenderTargetAvailable("local", true)).toBe(true);
  });

  it("allows cloud renders only when the cloud is reachable", () => {
    expect(isRenderTargetAvailable("cloud", true)).toBe(true);
    expect(isRenderTargetAvailable("cloud", false)).toBe(false);
  });
});

describe("model availability", () => {
  it("makes third-party models unavailable without cloud access", () => {
    // They prefer the cloud but still run on the user's own fal key offline.
    expect(
      isVideoModelAvailable(VideoEngine.seedance_2, false, ALL_ENABLED)
    ).toBe(false);
    expect(isImageModelAvailable("qwen", false)).toBe(true);
  });

  it("keeps a Comfy model usable with no cloud access", () => {
    expect(
      isVideoModelAvailable(VideoEngine.wan_vace_2_1, false, ALL_ENABLED)
    ).toBe(true);
  });

  it("hides a model whose only providers are switched off", () => {
    expect(
      isVideoModelAvailable(VideoEngine.wan_vace_2_1, true, {
        ...ALL_ENABLED,
        "local-comfy": false
      })
    ).toBe(false);
  });

  it("marks cloud models unavailable without cloud access", () => {
    expect(isVideoModelAvailable(VideoEngine.V8_0_0, false, ALL_ENABLED)).toBe(
      false
    );
    expect(isVideoModelAvailable(VideoEngine.V8_0_0, true, ALL_ENABLED)).toBe(
      true
    );
    expect(isImageModelAvailable("mago", false)).toBe(false);
    expect(isImageModelAvailable("mago", true)).toBe(true);
  });
});
