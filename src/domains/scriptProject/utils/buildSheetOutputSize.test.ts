import { describe, expect, it } from "vitest";

import { SCRIPT_PROJECT_ASPECT_RATIOS } from "../constants";

import { buildOutputSize } from "./buildOutputSize";
import {
  buildSheetOutputSize,
  resolveSheetResolution
} from "./buildSheetOutputSize";

describe("sheet resolution contract", () => {
  it.each([undefined, "1k", "2k", "unknown", "1m"])(
    "defaults the stored tier %s to 1m",
    (value) => {
      expect(resolveSheetResolution(value)).toBe("1m");
    }
  );

  it("recognises the new 2m tier", () => {
    expect(resolveSheetResolution("2m")).toBe("2m");
    expect(buildSheetOutputSize([720, 1280], "2m")).toEqual([1088, 1928]);
  });

  it("uses portrait 1m when no canvas is available", () => {
    expect(buildSheetOutputSize([0, 0], "1m")).toEqual([768, 1368]);
  });

  it("snaps a non-native aspect to the nearest supported aspect", () => {
    expect(buildSheetOutputSize([1000, 700], "1m")).toEqual([1184, 888]);
  });

  it.each(SCRIPT_PROJECT_ASPECT_RATIOS)(
    "keeps the $id sheet size independent of video resolution",
    ({ id }) => {
      for (const tier of ["1m", "2m"] as const) {
        const expected = buildSheetOutputSize(
          buildOutputSize(id, "720p"),
          tier
        );
        expect(buildSheetOutputSize(buildOutputSize(id, "480p"), tier)).toEqual(
          expected
        );
        expect(
          buildSheetOutputSize(buildOutputSize(id, "1080p"), tier)
        ).toEqual(expected);
        expect(expected[0] % 8).toBe(0);
        expect(expected[1] % 8).toBe(0);
      }
    }
  );
});
