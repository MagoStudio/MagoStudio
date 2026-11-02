import { describe, expect, it } from "vitest";

import { buildProjectCutView } from "./projectCutView";

const shot = (index: number, overrides: Record<string, unknown> = {}) => ({
  timeline_id: `shot-${index}`,
  shot_index: index - 1,
  sequence_id: index,
  heading: `${index} Kitchen`,
  ...overrides
});

const renderedEntry = (index: number) => ({
  timeline_id: `shot-${index}`,
  shot_index: index - 1,
  sequence_id: index,
  heading: "stale heading",
  asset_id: `video-${index}`,
  versions: [{ asset_id: `video-${index}`, ready: true }]
});

describe("buildProjectCutView", () => {
  it("lists a hidden shot with its renders apart from the play-out", () => {
    const view = buildProjectCutView({
      projectId: "project-1",
      stateShots: [shot(1), shot(2, { hidden: true })],
      storedCut: { shots: [renderedEntry(1), renderedEntry(2)], export: null }
    });
    expect((view.shots as unknown[]).length).toBe(1);
    expect(view.hidden_shots).toEqual([
      expect.objectContaining({ timeline_id: "shot-2", asset_id: "video-2" })
    ]);
  });

  it("leaves dropped shots out entirely", () => {
    const view = buildProjectCutView({
      projectId: "project-1",
      stateShots: [shot(1, { dropped: true }), shot(2)],
      storedCut: { shots: [renderedEntry(1), renderedEntry(2)] }
    });
    expect(view.shots).toEqual([
      expect.objectContaining({ timeline_id: "shot-2" })
    ]);
    expect(view.hidden_shots).toEqual([]);
  });

  it("follows the state's order and headings and names unrendered shots by timeline", () => {
    const view = buildProjectCutView({
      projectId: "project-1",
      stateShots: [
        shot(1, { shot_index: 1 }),
        shot(9, { shot_index: 0, sequence_id: null, heading: null })
      ],
      storedCut: { shots: [renderedEntry(1)] }
    });
    expect(
      (view.shots as Array<Record<string, unknown>>).map((entry) => [
        entry.timeline_id,
        entry.heading
      ])
    ).toEqual([
      ["shot-9", null],
      ["shot-1", "1 Kitchen"]
    ]);
    expect(view.missing).toEqual([null]);
    expect(view.missing_timeline_ids).toEqual(["shot-9"]);
  });
});
