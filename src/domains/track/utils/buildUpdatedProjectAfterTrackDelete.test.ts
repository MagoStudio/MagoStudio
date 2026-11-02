import { createLayer } from "@tests/factories/layer";
import { createProject } from "@tests/factories/project";
import { createShot } from "@tests/factories/shot";
import { describe, expect, it } from "vitest";

import { buildUpdatedProjectAfterTrackDelete } from "./buildUpdatedProjectAfterTrackDelete";

describe("buildUpdatedProjectAfterTrackDelete", () => {
  it("returns undefined when project is undefined", () => {
    const result = buildUpdatedProjectAfterTrackDelete(
      undefined,
      "shot-1",
      "layer-1"
    );
    expect(result).toBeUndefined();
  });

  it("returns project unchanged when no matching shot is found", () => {
    const project = createProject({
      timelines: [createShot({ id: "shot-other" })]
    });
    const result = buildUpdatedProjectAfterTrackDelete(
      project,
      "shot-not-found",
      "layer-1"
    );
    expect(result).toBe(project);
  });

  it("returns project unchanged when shotId is undefined", () => {
    const project = createProject();
    const result = buildUpdatedProjectAfterTrackDelete(
      project,
      undefined,
      "layer-1"
    );
    expect(result).toBe(project);
  });

  it("removes the matching layer from the matching shot", () => {
    const layerToDelete = createLayer({ id: "layer-to-delete" });
    const otherLayer = createLayer({ id: "layer-keep" });
    const shot = createShot({
      id: "shot-1",
      layers: [layerToDelete, otherLayer]
    });
    const project = createProject({ timelines: [shot] });

    const result = buildUpdatedProjectAfterTrackDelete(
      project,
      "shot-1",
      "layer-to-delete"
    );

    const resultShot = result?.timelines?.find((t) => t.id === "shot-1");
    expect(resultShot?.layers).toHaveLength(1);
    expect(resultShot?.layers[0].id).toBe("layer-keep");
  });

  it("does not mutate the original project", () => {
    const layer = createLayer({ id: "layer-1" });
    const shot = createShot({ id: "shot-1", layers: [layer] });
    const project = createProject({ timelines: [shot] });

    buildUpdatedProjectAfterTrackDelete(project, "shot-1", "layer-1");

    expect(project.timelines?.[0].layers).toHaveLength(shot.layers.length);
  });

  it("leaves other shots untouched", () => {
    const layer = createLayer({ id: "layer-1" });
    const targetShot = createShot({ id: "shot-1", layers: [layer] });
    const otherShot = createShot({ id: "shot-2" });
    const project = createProject({ timelines: [targetShot, otherShot] });

    const result = buildUpdatedProjectAfterTrackDelete(
      project,
      "shot-1",
      "layer-1"
    );

    expect(result?.timelines?.find((t) => t.id === "shot-2")).toBe(otherShot);
  });
});
