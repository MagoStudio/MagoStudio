import { ShotGenerateResult } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { getShotRunRefusalDescriptionKey } from "./getShotRunRefusalDescriptionKey";

const result = (
  overrides: Partial<ShotGenerateResult> = {}
): ShotGenerateResult => ({
  would_run: [],
  would_run_keys: [],
  would_run_timeline_ids: [],
  skipped: [],
  blocked: [],
  sequential_ignored: [],
  changed: {},
  changed_by_timeline_id: {},
  plan_id: null,
  ...overrides
});

describe("getShotRunRefusalDescriptionKey", () => {
  it("is null when the press created a plan", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({ plan_id: "plan-1", would_run: [8] })
      )
    ).toBeNull();
  });

  it("explains a Shot the live plan is already rendering", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({
          skipped: [{ sequence_id: 8, reason: "render already in progress" }]
        })
      )
    ).toBe("script_project.shot_run_refused_in_progress.description");
  });

  it("explains a Shot that already rendered with these inputs", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({
          skipped: [
            { sequence_id: 8, reason: "already rendered with these inputs" }
          ]
        })
      )
    ).toBe("script_project.shot_run_refused_unchanged.description");
  });

  it("explains a Shot the latest cast dropped", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({
          skipped: [
            {
              sequence_id: 8,
              key: "8.1",
              timeline_id: "timeline-8a",
              reason: "dropped"
            }
          ]
        })
      )
    ).toBe("script_project.shot_run_refused_dropped.description");
  });

  it("names the missing reference ahead of any skip", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({
          blocked: [{ sequence_id: 8, missing: [] }],
          skipped: [{ sequence_id: 9, reason: "render already in progress" }]
        })
      )
    ).toBe("script_project.shot_run_refused_blocked.description");
  });

  it("falls back to generic copy for a reason we have no words for", () => {
    expect(
      getShotRunRefusalDescriptionKey(
        result({ skipped: [{ sequence_id: 8, reason: "something new" }] })
      )
    ).toBe("script_project.shot_run_refused_unknown.description");
  });

  it("falls back when nothing ran and nothing says why", () => {
    expect(getShotRunRefusalDescriptionKey(result())).toBe(
      "script_project.shot_run_refused_unknown.description"
    );
  });
});
