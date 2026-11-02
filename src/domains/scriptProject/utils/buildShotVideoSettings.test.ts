import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildShotFrameRange } from "./buildShotFrameRange";
import { buildShotVideoSettings } from "./buildShotVideoSettings";

describe("Seedance run settings", () => {
  it.each([
    [96, 96],
    [132, 144],
    [156, 144],
    [158, 168],
    [720, 720]
  ])(
    "sends %s project frames as an exclusive range ending at %s",
    (projectFrames, expectedEnd) => {
      expect(
        buildShotVideoSettings({
          shotEngine: VideoEngine.seedance_2_5,
          frameRange: buildShotFrameRange(projectFrames),
          maxQualityRetries: 3
        })
      ).toEqual({
        engine: VideoEngine.seedance_2_5,
        prompt_rewrite: "mago",
        frame_range: [0, expectedEnd],
        max_quality_retries: 0
      });
    }
  );
});
