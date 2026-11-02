import { describe, expect, it } from "vitest";

import { resolveSequentialShotConfig } from "./resolveSequentialShotConfig";

describe("resolveSequentialShotConfig", () => {
  it("reads a shot that never opted in as disabled, on the cheapest mode", () => {
    expect(resolveSequentialShotConfig(null)).toEqual({
      enabled: false,
      mode: "last_frame",
      num_select: 1,
      prompt_appendix: "",
      opening_frame: "cut"
    });
  });

  it("keeps every value the shot actually carries", () => {
    expect(
      resolveSequentialShotConfig({
        enabled: true,
        mode: "key_frames",
        num_select: 3,
        prompt_appendix: "Continue the motion."
      })
    ).toEqual({
      enabled: true,
      mode: "key_frames",
      num_select: 3,
      prompt_appendix: "Continue the motion.",
      opening_frame: "cut"
    });
  });

  it("keeps a chosen opening frame", () => {
    expect(
      resolveSequentialShotConfig({
        enabled: true,
        mode: "last_frame",
        opening_frame: "off"
      })
    ).toMatchObject({ opening_frame: "off" });
  });

  it("fills the extra setting a mode gained after the shot opted in", () => {
    expect(
      resolveSequentialShotConfig({ enabled: true, mode: "key_frames" })
    ).toMatchObject({ num_select: 1 });
  });
});
