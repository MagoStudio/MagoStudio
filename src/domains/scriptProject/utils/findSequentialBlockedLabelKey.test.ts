import { ShotGenerateResult, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { findSequentialBlockedLabelKey } from "./findSequentialBlockedLabelKey";

const shot = { timeline_id: "t1" } as ShotState;

const buildDryRun = (
  blocked: ShotGenerateResult["blocked"]
): ShotGenerateResult =>
  ({ blocked, would_run: [], skipped: [] }) as unknown as ShotGenerateResult;

describe("findSequentialBlockedLabelKey", () => {
  it("returns nothing when the shot is not blocked at all", () => {
    expect(findSequentialBlockedLabelKey(buildDryRun([]), shot)).toBeNull();
  });

  it("returns nothing for an entity block, which the missing list already explains", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [{ token: "@bob", reason: "no image" }]
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBeNull();
  });

  it("names the unsupported-engine case", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [],
        reason_code: "unsupported_engine",
        reason:
          "sequential: this engine does not support a cross-shot reference yet — only MiniMax (v9.1.0) does"
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBe(
      "script_project.shot_blocked_sequential_unsupported_engine.label"
    );
  });

  it("names the unrendered-predecessor case", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [],
        reason_code: "predecessor_not_rendered",
        reason:
          "sequential: the previous shot has no finished render to continue from — render it first, or pin one of its versions"
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBe(
      "script_project.shot_blocked_sequential_no_predecessor_render.label"
    );
  });

  it("names the unsupported-continuation-mode case", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [],
        reason_code: "unsupported_sequential_mode",
        reason: "sequential: this continuation mode is not supported"
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBe(
      "script_project.shot_blocked_sequential_unsupported_mode.label"
    );
  });

  it("names the opening-frame case", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [],
        reason_code: "unsupported_opening_frame",
        reason: "sequential: this engine can't pin the opening frame yet"
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBe(
      "script_project.shot_blocked_sequential_unsupported_opening_frame.label"
    );
  });

  it("returns nothing for a reason it does not recognise, rather than guessing from the sentence", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [],
        reason_code: null,
        reason: "sequential: something new the backend started sending"
      }
    ]);
    expect(findSequentialBlockedLabelKey(dryRun, shot)).toBeNull();
  });
});
