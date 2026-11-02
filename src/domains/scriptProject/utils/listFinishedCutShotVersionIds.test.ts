import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { listFinishedCutShotVersionIds } from "./listFinishedCutShotVersionIds";

const versionWith = (assetId: string, ready: boolean) => ({
  layer_id: "layer",
  asset_id: assetId,
  ready,
  status: ready ? "finished" : "pending"
});

describe("listFinishedCutShotVersionIds", () => {
  it("lists the finished versions of shown and hidden scenes, leaving out ones still rendering", () => {
    const cut = ProjectCutSchema.parse({
      project_id: "project",
      shots: [
        {
          timeline_id: "shown",
          shot_index: 0,
          sequence_id: 1,
          versions: [
            versionWith("finished", true),
            versionWith("rendering", false)
          ]
        }
      ],
      hidden_shots: [
        {
          timeline_id: "hidden",
          shot_index: 1,
          sequence_id: 2,
          versions: [versionWith("hidden-finished", true)]
        }
      ]
    });

    expect(listFinishedCutShotVersionIds(cut)).toEqual([
      "finished",
      "hidden-finished"
    ]);
  });
});
