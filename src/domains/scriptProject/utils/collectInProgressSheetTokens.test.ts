import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { collectInProgressSheetTokens } from "./collectInProgressSheetTokens";

const step = (
  toolName: string,
  status: string,
  result: unknown = null
): BulkRendersRunStep =>
  ({
    id: `${toolName}-${status}`,
    plan_id: "plan-1",
    timeline_id: "sheets-timeline",
    step_order: 0,
    tool_name: toolName,
    status,
    result,
    error: null,
    retry_count: null,
    started_at: null,
    finished_at: null
  }) as unknown as BulkRendersRunStep;

/** The submit step's shape. `completed` carries the keys a PREVIOUS pass rendered, so it is
 * empty on a first pass — the backend fills it from the plan's accumulator. */
const submitResult = (
  jobKeys: string[],
  completedKeys: string[],
  itemKeys: string[] = []
) => ({
  jobs: jobKeys.map((key) => ({ key })),
  items: itemKeys.map((key) => ({ key })),
  completed: Object.fromEntries(completedKeys.map((key) => [key, "asset-id"]))
});

/** The poll step's shape: the keys whose renders landed, plus the ones that failed and will be
 * re-submitted by the next pass. */
const pollResult = (imageKeys: string[], failedKeys: string[] = []) => ({
  images: Object.fromEntries(imageKeys.map((key) => [key, "asset-id"])),
  failed: failedKeys
});

describe("collectInProgressSheetTokens", () => {
  it("names the entities a running sheet plan is still rendering", () => {
    const tokens = collectInProgressSheetTokens([
      step(
        "submit_img2img_batch",
        "COMPLETED",
        submitResult(["d_artagnan", "courtyard"], [])
      ),
      step("poll_img2img_batch", "RUNNING")
    ]);

    expect([...tokens].sort()).toEqual(["courtyard", "d_artagnan"]);
  });

  it("clears an entity as soon as its own image lands, not when the plan settles", () => {
    const tokens = collectInProgressSheetTokens([
      step(
        "submit_img2img_batch",
        "COMPLETED",
        submitResult(["d_artagnan", "courtyard"], [])
      ),
      step(
        "poll_img2img_batch",
        "COMPLETED",
        pollResult(["courtyard"], ["d_artagnan"])
      ),
      step(
        "submit_img2img_batch",
        "RUNNING",
        submitResult(["d_artagnan"], ["courtyard"])
      ),
      step("poll_img2img_batch", "PENDING")
    ]);

    expect([...tokens]).toEqual(["d_artagnan"]);
  });

  it("keeps badging a key the poll reported failed, because the next pass retries it", () => {
    const tokens = collectInProgressSheetTokens([
      step("submit_img2img_batch", "COMPLETED", submitResult(["pony"], [])),
      step("poll_img2img_batch", "COMPLETED", pollResult([], ["pony"])),
      step("submit_img2img_batch", "RUNNING", submitResult(["pony"], [])),
      step("poll_img2img_batch", "PENDING")
    ]);

    expect([...tokens]).toEqual(["pony"]);
  });

  it("drops an entity a later pass records as already rendered", () => {
    const tokens = collectInProgressSheetTokens([
      step(
        "submit_img2img_batch",
        "COMPLETED",
        submitResult(["d_artagnan", "courtyard"], [])
      ),
      step(
        "submit_img2img_batch",
        "RUNNING",
        submitResult(["d_artagnan"], ["courtyard"])
      ),
      step("poll_img2img_batch", "PENDING")
    ]);

    expect([...tokens]).toEqual(["d_artagnan"]);
  });

  it("counts entities planned but not yet submitted", () => {
    const tokens = collectInProgressSheetTokens([
      step("submit_img2img_batch", "RUNNING", submitResult([], [], ["pony"])),
      step("poll_img2img_batch", "PENDING")
    ]);

    expect([...tokens]).toEqual(["pony"]);
  });

  it("is empty once every step has settled", () => {
    const tokens = collectInProgressSheetTokens([
      step(
        "submit_img2img_batch",
        "COMPLETED",
        submitResult(["d_artagnan"], [])
      ),
      step("poll_img2img_batch", "COMPLETED", pollResult(["d_artagnan"]))
    ]);

    expect(tokens.size).toBe(0);
  });

  it("survives a step whose result is missing or a different shape", () => {
    const tokens = collectInProgressSheetTokens([
      step("submit_img2img_batch", "RUNNING"),
      step("submit_img2img_batch", "RUNNING", { unexpected: true }),
      step("poll_img2img_batch", "PENDING", { images: "not-a-record" }),
      step("poll_img2img_batch", "PENDING")
    ]);

    expect(tokens.size).toBe(0);
  });

  it("is empty when the steps have not loaded", () => {
    expect(collectInProgressSheetTokens(undefined).size).toBe(0);
  });
});
