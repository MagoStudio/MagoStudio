import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { doesModelSupportTagsInPrompt } from "./doesModelSupportTagsInPrompt";

describe("doesModelSupportTagsInPrompt", () => {
  it.each([
    VideoEngine.happy_horse_1,
    VideoEngine.seedance_2,
    VideoEngine.seedance_2_5,
    VideoEngine.kling_o1,
    VideoEngine.kling_o3_edit_pro
  ])("returns true for tags-in-prompt engine %s", (engine) => {
    expect(doesModelSupportTagsInPrompt(engine)).toBe(true);
  });

  const TAGS_IN_PROMPT_ENGINES = new Set<string>([
    VideoEngine.happy_horse_1,
    VideoEngine.seedance_2,
    VideoEngine.seedance_2_5,
    VideoEngine.kling_o1,
    VideoEngine.kling_o3_edit_pro
  ]);
  const nonTagsEngines = Object.values(VideoEngine).filter(
    (engine) => !TAGS_IN_PROMPT_ENGINES.has(engine)
  );

  it.each(nonTagsEngines)(
    "returns false for every other VideoEngine (exhaustive): %s",
    (engine) => {
      expect(doesModelSupportTagsInPrompt(engine)).toBe(false);
    }
  );

  it("returns false for undefined", () => {
    expect(doesModelSupportTagsInPrompt(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(doesModelSupportTagsInPrompt("unknown_engine")).toBe(false);
  });
});
