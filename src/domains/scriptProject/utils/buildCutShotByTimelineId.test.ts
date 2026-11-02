import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildCutShotByTimelineId } from "./buildCutShotByTimelineId";

const buildCutShot = (timelineId: string, url: string) => ({
  timeline_id: timelineId,
  shot_index: 0,
  sequence_id: null,
  asset_id: `${timelineId}-render`,
  url,
  poster_url: null,
  versions: []
});

describe("buildCutShotByTimelineId", () => {
  it("is empty without a cut", () => {
    expect(buildCutShotByTimelineId(undefined).size).toBe(0);
  });

  it("finds a Shot in the cut and a hidden Shot left out of it", () => {
    const cut = ProjectCutSchema.parse({
      project_id: "project",
      shots: [buildCutShot("visible", "https://cdn.example.com/visible.mp4")],
      hidden_shots: [
        buildCutShot("hidden", "https://cdn.example.com/hidden.mp4")
      ]
    });

    const cutShotByTimelineId = buildCutShotByTimelineId(cut);

    expect(cutShotByTimelineId.get("visible")?.url).toBe(
      "https://cdn.example.com/visible.mp4"
    );
    expect(cutShotByTimelineId.get("hidden")?.url).toBe(
      "https://cdn.example.com/hidden.mp4"
    );
  });

  it("reads a cut from a backend that sends no hidden_shots", () => {
    const cut = ProjectCutSchema.parse({
      project_id: "project",
      shots: [buildCutShot("visible", "https://cdn.example.com/visible.mp4")]
    });

    expect([...buildCutShotByTimelineId(cut).keys()]).toEqual(["visible"]);
  });
});
