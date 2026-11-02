import { CutExportRefusal } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { describeCutExportRefusal } from "./describeCutExportRefusal";

const refusal = (overrides: Partial<CutExportRefusal>): CutExportRefusal => ({
  reason: "mixed_video_profile",
  sequence_ids: [],
  timeline_ids: [],
  profiles: [],
  ...overrides
});

describe("describeCutExportRefusal", () => {
  it("says nothing when the cut can be exported", () => {
    expect(describeCutExportRefusal([])).toBeNull();
    expect(describeCutExportRefusal(undefined)).toBeNull();
  });

  it("names the smaller group of a mixed profile, because those are the odd shots out", () => {
    const description = describeCutExportRefusal([
      refusal({
        profiles: [
          {
            width: 1280,
            height: 720,
            fps: 24,
            sequence_ids: [2, 3],
            timeline_ids: []
          },
          {
            width: 2560,
            height: 1440,
            fps: 24,
            sequence_ids: [1],
            timeline_ids: []
          }
        ]
      })
    ]);

    expect(description).toEqual({
      labelKey: "script_project.export_refused_mixed_profile.label",
      shotNumbers: [1]
    });
  });

  it("names the shots on a missing pin", () => {
    const description = describeCutExportRefusal([
      refusal({ reason: "missing_pinned_video", sequence_ids: [7, 4] })
    ]);

    expect(description).toEqual({
      labelKey: "script_project.export_refused_missing_pin.label",
      shotNumbers: [4, 7]
    });
  });

  it("names the shots on an unrecorded profile", () => {
    const description = describeCutExportRefusal([
      refusal({ reason: "unknown_video_profile", sequence_ids: [5] })
    ]);

    expect(description?.labelKey).toBe(
      "script_project.export_refused_unknown_profile.label"
    );
  });

  it("still explains a reason the frontend has never heard of", () => {
    const description = describeCutExportRefusal([
      refusal({ reason: "some_new_backend_reason", sequence_ids: [2] })
    ]);

    expect(description).toEqual({
      labelKey: "script_project.export_refused_unknown_reason.label",
      shotNumbers: [2]
    });
  });

  it("falls back to the flat shot list when a mixed profile carries no groups", () => {
    const description = describeCutExportRefusal([
      refusal({ sequence_ids: [9], profiles: [] })
    ]);

    expect(description?.shotNumbers).toEqual([9]);
  });

  it("describes only the first refusal, since the fallback runs regardless", () => {
    const description = describeCutExportRefusal([
      refusal({
        reason: "missing_pinned_video",
        sequence_ids: [1],
        timeline_ids: []
      }),
      refusal({ reason: "unknown_video_profile", sequence_ids: [2] })
    ]);

    expect(description?.shotNumbers).toEqual([1]);
  });
});
