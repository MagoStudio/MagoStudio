import { VideoEngine } from "@models/video/types";
import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { getShotDurationBounds } from "../constants";

import { isShotDurationOutOfBounds } from "./isShotDurationOutOfBounds";
import { resolveShotRenderFrames } from "./resolveShotRenderFrames";

const engine = VideoEngine.seedance_2_5;
describe("Seedance Shot duration", () => {
  it("uses the 4-30 second contract in validation", () => {
    expect(getShotDurationBounds(engine)).toEqual({
      minSeconds: 4,
      maxSeconds: 30
    });
    expect(
      isShotDurationOutOfBounds({ duration_s: 30 } as ShotState, 144, engine)
    ).toBe(false);
    expect(
      isShotDurationOutOfBounds({ duration_s: 3.9 } as ShotState, 144, engine)
    ).toBe(true);
  });
  it.each([
    [5.4, 120],
    [5.5, 144],
    [6.5, 144],
    [30, 720]
  ])(
    "rounds %s seconds to the actual Seedance frame count",
    (seconds, frames) => {
      expect(
        resolveShotRenderFrames({
          shotDurationSeconds: seconds,
          projectShotFrames: 144,
          shotEngine: engine
        })
      ).toBe(frames);
    }
  );
});
