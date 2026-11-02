import { Layer } from "@schemas/layer";
import { createAsset } from "@tests/factories/asset";
import { createClip } from "@tests/factories/clip";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackErrorMessage } from "./getTrackErrorMessage";

describe("getTrackErrorMessage", () => {
  it("returns the asset's error message", () => {
    const asset = createAsset({
      data: {
        error: { error: "Output audio has sensitive content." }
      }
    });
    const layer = createLayer({ clips: [createClip({ asset })] });

    expect(getTrackErrorMessage(layer)).toBe(
      "Output audio has sensitive content."
    );
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackErrorMessage(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackErrorMessage(layer as Layer)).toBeUndefined();
  });

  it("returns undefined when the asset has no error", () => {
    const asset = createAsset({ data: {} });
    const layer = createLayer({ clips: [createClip({ asset })] });

    expect(getTrackErrorMessage(layer)).toBeUndefined();
  });
});
