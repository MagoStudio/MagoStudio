import { describe, expect, it } from "vitest";

import { SEQUENTIAL_CONTINUATION_OFF } from "../constants";

import { ResolvedSequentialShotConfig } from "./resolveSequentialShotConfig";
import { withSequentialContinuation } from "./withSequentialContinuation";

const config: ResolvedSequentialShotConfig = {
  enabled: true,
  mode: "key_frames",
  num_select: 3,
  prompt_appendix: "Keep the motion going.",
  opening_frame: "cut"
};

describe("withSequentialContinuation", () => {
  it("turns sequential off and keeps the other settings for later", () => {
    expect(
      withSequentialContinuation(config, SEQUENTIAL_CONTINUATION_OFF)
    ).toEqual({ ...config, enabled: false });
  });

  it("turns sequential on with the picked mode", () => {
    expect(
      withSequentialContinuation({ ...config, enabled: false }, "last_frame")
    ).toEqual({ ...config, enabled: true, mode: "last_frame" });
  });
});
