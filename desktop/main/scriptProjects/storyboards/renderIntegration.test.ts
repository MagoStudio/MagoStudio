import { describe, expect, it, vi } from "vitest";

import { planShotRun } from "../shots/planShotRun";
import { buildShotVideoPromptBody } from "../videoPrompt/shotVideoPromptBody";
import { generateVideoPrompt } from "../videoPrompt/videoPrompt";

const shot = {
  timeline_id: "scene",
  sequence_id: 1,
  shot_index: 0,
  duration_s: 6,
  video_prompt: "[Shot 1] A cat runs.",
  references: { characters: [{ token: "cat", asset_id: "cat-image" }] },
  tags: { characters: ["cat"] }
};
const board = { asset_id: "board-image", panel_count: 1 };
const plan = (extra = {}) =>
  planShotRun({
    shots: [{ ...shot, ...extra }],
    cutShots: [],
    request: {},
    inFlight: new Map()
  }).planned[0]!;
describe("Storyboard Shot rendering", () => {
  it("adds only a used board to the fingerprint and freezes its selected asset", () => {
    const original = plan();
    expect(original.renderSpec.spec).not.toHaveProperty("storyboard");
    expect(plan({ _local_storyboard: null }).renderSpec.fingerprint).toBe(
      original.renderSpec.fingerprint
    );
    expect(plan({ _local_storyboard: board }).renderSpec.spec).toMatchObject({
      storyboard: ["board-image"]
    });
    expect(
      plan({ _local_storyboard: board, prompt_rewrite: "raw" }).renderSpec.spec
    ).not.toHaveProperty("storyboard");
  });
  it("orders a board between cast and continuity and tells the composer its panel count", async () => {
    const body = buildShotVideoPromptBody({
      shot: { ...shot, _local_storyboard: board },
      keys: [{ token: "cat", name: "Cat", description: "A cat." }],
      referenceSlots: [["cat-image"]],
      imageAssetIds: ["cat-image"],
      continuityImage: { id: "continuity", description: "Continue here." },
      continuityVideo: null,
      durationSeconds: 6
    });
    expect(body.references).toMatchObject([
      { asset_id: "cat-image" },
      { asset_id: "board-image", ref_id: "storyboard-sheet", panel_count: 1 },
      { asset_id: "continuity", ref_id: "prev_shot" }
    ]);
    const result = await generateVideoPrompt(
      body,
      vi.fn().mockRejectedValue(new Error("Offline"))
    );
    expect(result.prompt).toContain("Stage this shot as panel 1");
    expect(result.prompt).toContain("partially_preserved");
  });
});
