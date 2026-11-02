import { SourceImage } from "@domains/renders/types";
import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, expect, it } from "vitest";

import { passThroughOwnedSources } from "./passThroughOwnedSources";

const context = (sources: SourceImage[]): PrepareRenderSettingsContext => ({
  frameRange: [0, 24],
  fps: 24,
  sources
});

describe("passThroughOwnedSources", () => {
  it("returns context.sources unchanged, ignoring settings", () => {
    const sources: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "motion_reference" }
    ];
    expect(passThroughOwnedSources({} as VideoSettings, context(sources))).toBe(
      sources
    );
  });

  it("returns an empty array when the model has no sources selected", () => {
    expect(passThroughOwnedSources({} as VideoSettings, context([]))).toEqual(
      []
    );
  });
});
