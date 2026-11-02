import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { buildStoryboardPrompt } from "./buildStoryboardPrompt";
import { applyStoryboardLines, storyboardRetention } from "./composer";
import {
  sceneCuts,
  sceneFingerprint,
  storyboardState,
  storyboardReference
} from "./storyboard";
import { templateLayout, templatePng } from "./template";

const shot = {
  timeline_id: "scene",
  video_prompt:
    "A room.\n\n[Shot 1] (0-3s) A cat walks.\n[Shot 2] (3-6s) It turns back to [Shot 1]'s door.",
  tags: { characters: ["cat"] }
};
const cast = [
  {
    token: "cat",
    kind: "character",
    name: "Cat",
    description: "A striped cat."
  }
];
const image = {
  asset_id: "board-image",
  clip_id: "clip",
  url: "mago-media://script-project/board-image",
  thumbnail_url: "mago-media://script-project/board-image",
  status: "available",
  panel_count: 2,
  storyboard_scene_fingerprint: sceneFingerprint(shot, cast)
};
const board = {
  token: "storyboard_scene",
  role: "storyboard",
  timeline_id: "scene",
  enabled: true,
  images: [image]
};
describe("desktop Storyboards", () => {
  it("splits only sequential cut headings and strips spoken lines without losing a panel", () => {
    expect(sceneCuts(shot.video_prompt).cuts).toEqual([
      "A cat walks.",
      "It turns back to [Shot 1]'s door."
    ]);
    expect(sceneCuts("[Shot 1] CAT: {{line:1}} [Shot 2] Runs.").cuts).toEqual([
      "",
      "Runs."
    ]);
    expect(sceneCuts("Description.\n\nOnly cut.")).toEqual({
      context: "Description.",
      cuts: ["Only cut."]
    });
  });
  it("ignores scene descriptions, entity descriptions, whitespace and output size for staleness", () => {
    expect(
      sceneFingerprint(
        {
          ...shot,
          video_prompt: shot.video_prompt.replace(
            "A room.",
            "A different room."
          ),
          output_size: [1, 1]
        },
        [{ ...cast[0], description: "A new caption." }]
      )
    ).toBe(sceneFingerprint(shot, cast));
    expect(
      sceneFingerprint(
        { ...shot, video_prompt: shot.video_prompt.replace("walks", "runs") },
        cast
      )
    ).not.toBe(sceneFingerprint(shot, cast));
    expect(sceneFingerprint(shot, [{ ...cast[0], name: "Mittens" }])).not.toBe(
      sceneFingerprint(shot, cast)
    );
    expect(sceneFingerprint({ ...shot, tags: {} }, cast)).not.toBe(
      sceneFingerprint(shot, cast)
    );
    expect(
      sceneFingerprint({ ...shot, video_prompt: "[Shot 1] A cat walks." }, cast)
    ).not.toBe(sceneFingerprint(shot, cast));
  });
  it("reports ready, stale and disabled references", () => {
    expect(storyboardState(shot, [...cast, board])).toMatchObject({
      status: "ready",
      effective_asset_id: "board-image",
      panel_count: 2
    });
    expect(storyboardReference(shot, [...cast, board])).toEqual({
      asset_id: "board-image",
      panel_count: 2
    });
    expect(
      storyboardReference(shot, [...cast, { ...board, enabled: false }])
    ).toBeNull();
    expect(
      storyboardReference({ ...shot, video_prompt: "Different cut." }, [
        ...cast,
        board
      ])
    ).toBeNull();
  });
  it("keeps an earlier success after a failed attempt and honors an explicit pin", () => {
    const plans = [{ status: "PAUSED", local_targets: [board] }];
    expect(storyboardState(shot, [...cast, board], plans)).toMatchObject({
      status: "ready",
      last_attempt_failed: true
    });
    expect(storyboardState(shot, [], plans)).toMatchObject({
      status: "failed"
    });
    expect(
      storyboardState(shot, [
        ...cast,
        {
          ...board,
          selected_asset_id: "board-image",
          images: [image, { ...image, asset_id: "new" }]
        }
      ])
    ).toMatchObject({ effective_asset_id: "board-image" });
    expect(
      storyboardState(
        shot,
        [...cast, board],
        [{ status: "PENDING", local_targets: [board] }]
      )
    ).toMatchObject({ status: "generating" });
  });
  it.each([1, 2, 3, 8, 15])(
    "draws a valid numbered PNG for %i panels within the sheet",
    (count) => {
      const layout = templateLayout(count, [720, 1280]);
      expect(layout.panels).toHaveLength(count);
      for (const panel of layout.panels) {
        expect(panel.left).toBeGreaterThanOrEqual(0);
        expect(panel.top).toBeGreaterThan(25);
        expect(panel.left + panel.width).toBeLessThanOrEqual(1536);
        expect(panel.top + panel.height).toBeLessThanOrEqual(864);
      }
      const png = templatePng(count, [720, 1280]);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(1536);
      const idatLength = png.readUInt32BE(33);
      const pixels = inflateSync(png.subarray(41, 41 + idatLength));
      expect(pixels.length).toBe((1536 * 3 + 1) * 864);
      expect(pixels.includes(255)).toBe(true);
    }
  );
  it.each([0, 16])("refuses invalid panel count %i", (count) =>
    expect(() => templatePng(count, [])).toThrow("1 to 15")
  );
  it("uses the backend line-art prompt and ordered panels without visual style", () => {
    const prompt = buildStoryboardPrompt(
      { ...shot, visual_style: "Oil painting" },
      cast,
      [720, 1280]
    );
    expect(prompt).toContain("Simple black line art on white paper");
    expect(prompt).toContain("exactly 1 character: Cat (A striped cat.)");
    expect(prompt).toContain("Panel 2: It turns back to [Shot 1]'s door.");
    expect(prompt).not.toContain("Oil painting");
  });
  it("retains composition and stages each sequential cut without splitting mentions", () => {
    const labels = [
      {
        label: "Image 1",
        kind: "image",
        ref_id: "storyboard-sheet",
        panel_count: 2
      }
    ];
    const retention = storyboardRetention(labels);
    expect(retention).toEqual({ "Image 1": "partially_preserved" });
    const result = applyStoryboardLines(
      {
        retention_analysis: "Image 1: weak_reference",
        detailed_description:
          "[Shot 1] At 00:00, walks back to [Shot 1]'s door.\n[Shot 2] At 00:03, turns."
      },
      labels,
      retention
    );
    expect(result.retention_analysis).toBe("Image 1: partially_preserved");
    expect(result.detailed_description.match(/Stage this shot/g)).toHaveLength(
      2
    );
  });
});
