import { createLayer } from "@tests/factories/layer";
import { createProject } from "@tests/factories/project";
import { createShot } from "@tests/factories/shot";
import { describe, expect, it } from "vitest";

import { buildUpdatedProjectAfterRender } from "./buildUpdatedProjectAfterRender";

describe("buildUpdatedProjectAfterRender", () => {
  it("returns undefined when project is undefined", () => {
    const layer = createLayer();
    const result = buildUpdatedProjectAfterRender(undefined, "shot-1", layer);
    expect(result).toBeUndefined();
  });

  it("returns project unchanged when no matching shot is found", () => {
    const layer = createLayer();
    const project = createProject({
      timelines: [createShot({ id: "shot-other" })]
    });
    const result = buildUpdatedProjectAfterRender(
      project,
      "shot-not-found",
      layer
    );
    expect(result).toBe(project);
  });

  it("returns project unchanged when selectedShotId is undefined", () => {
    const layer = createLayer();
    const project = createProject();
    const result = buildUpdatedProjectAfterRender(project, undefined, layer);
    expect(result).toBe(project);
  });

  it("replaces the matching layer inside the matching shot", () => {
    const originalLayer = createLayer({ id: "layer-1", name: "original" });
    const updatedLayer = createLayer({ id: "layer-1", name: "rendered" });
    const shot = createShot({ id: "shot-1", layers: [originalLayer] });
    const project = createProject({ timelines: [shot] });

    const result = buildUpdatedProjectAfterRender(
      project,
      "shot-1",
      updatedLayer
    );

    const resultShot = result?.timelines?.find((t) => t.id === "shot-1");
    expect(resultShot?.layers[0].name).toBe("rendered");
  });

  it("does not mutate the original project", () => {
    const originalLayer = createLayer({ id: "layer-1", name: "original" });
    const updatedLayer = createLayer({ id: "layer-1", name: "rendered" });
    const shot = createShot({ id: "shot-1", layers: [originalLayer] });
    const project = createProject({ timelines: [shot] });

    buildUpdatedProjectAfterRender(project, "shot-1", updatedLayer);

    expect(project.timelines?.[0].layers[0].name).toBe("original");
  });

  it("leaves other shots untouched", () => {
    const layer = createLayer({ id: "layer-1" });
    const updatedLayer = createLayer({ id: "layer-1", name: "rendered" });
    const targetShot = createShot({ id: "shot-1", layers: [layer] });
    const otherShot = createShot({ id: "shot-2" });
    const project = createProject({ timelines: [targetShot, otherShot] });

    const result = buildUpdatedProjectAfterRender(
      project,
      "shot-1",
      updatedLayer
    );

    expect(result?.timelines?.find((t) => t.id === "shot-2")).toBe(otherShot);
  });
});
