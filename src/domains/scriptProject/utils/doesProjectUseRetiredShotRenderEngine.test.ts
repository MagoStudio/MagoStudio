import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
  SCRIPT_TO_SHOTS_PROJECT_TYPE
} from "../constants";

import { doesProjectUseRetiredShotRenderEngine } from "./doesProjectUseRetiredShotRenderEngine";

const scriptProjectWithShotEngine = (shotEngine: string | undefined) => ({
  type: SCRIPT_TO_SHOTS_PROJECT_TYPE,
  settings: { shot_engine: shotEngine }
});

describe("doesProjectUseRetiredShotRenderEngine", () => {
  it.each([undefined, VideoEngine.minimax_reference, "minimax_h3_local"])(
    "keeps local projects on their selected engine (%s)",
    (engine) => {
      expect(
        doesProjectUseRetiredShotRenderEngine({
          ...scriptProjectWithShotEngine(engine),
          origin: "local"
        })
      ).toBe(false);
    }
  );
  it("flags a script project stored on the retired Slow engine", () => {
    expect(
      doesProjectUseRetiredShotRenderEngine(
        scriptProjectWithShotEngine(VideoEngine.minimax_reference)
      )
    ).toBe(true);
  });

  it("flags a script project with no stored engine, which renders on Slow", () => {
    expect(
      doesProjectUseRetiredShotRenderEngine(
        scriptProjectWithShotEngine(undefined)
      )
    ).toBe(true);
  });

  it("leaves a script project on Fast alone", () => {
    expect(
      doesProjectUseRetiredShotRenderEngine(
        scriptProjectWithShotEngine(MINIMAX_H3_MAX_SHOT_RENDER_ENGINE)
      )
    ).toBe(false);
  });

  it("leaves a script project on Seedance 2.5 alone", () => {
    expect(
      doesProjectUseRetiredShotRenderEngine(
        scriptProjectWithShotEngine(VideoEngine.seedance_2_5)
      )
    ).toBe(false);
  });

  it("leaves a timeline project alone, which has no shot engine", () => {
    expect(
      doesProjectUseRetiredShotRenderEngine({
        type: "timeline",
        settings: {}
      })
    ).toBe(false);
  });

  it("waits for the project to load", () => {
    expect(doesProjectUseRetiredShotRenderEngine(undefined)).toBe(false);
  });
});
