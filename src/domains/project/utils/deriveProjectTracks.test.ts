import { LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { deriveProjectTracks } from "./deriveProjectTracks";

const renderLayer = (overrides: {
  id?: string;
  engine?: string;
  clips?: Array<{ fps?: number }>;
}) => ({
  id: overrides.id ?? "render-1",
  type: LayerType.RENDER,
  data: { renderEngine: overrides.engine ?? "magov2" },
  clips: (overrides.clips ?? [{}]).map((c, i) => ({
    id: `clip-${i}`,
    asset: { data: { ...c } }
  }))
});

const imageLayer = (fps?: number) => ({
  id: "image-1",
  type: LayerType.IMAGE,
  data: {},
  clips: [
    {
      id: "image-clip",
      asset: { data: fps !== undefined ? { fps } : {} }
    }
  ]
});

const buildProject = (layers: unknown[]): Project =>
  ({
    id: "project-1",
    timelines: [{ id: "shot-1", layers }]
  }) as unknown as Project;

describe("deriveProjectTracks", () => {
  it("strips magoV1 render tracks", () => {
    const project = buildProject([
      imageLayer(),
      renderLayer({ id: "v1", engine: "magov1" }),
      renderLayer({ id: "v2" })
    ]);
    const ids = deriveProjectTracks(project).timelines![0].layers.map(
      (l) => l.id
    );
    expect(ids).toEqual(["image-1", "v2"]);
  });

  it("strips empty render tracks", () => {
    const project = buildProject([
      imageLayer(),
      renderLayer({ id: "empty", clips: [] }),
      renderLayer({ id: "full" })
    ]);
    const ids = deriveProjectTracks(project).timelines![0].layers.map(
      (l) => l.id
    );
    expect(ids).toEqual(["image-1", "full"]);
  });

  it("propagates source FPS to render clips when present", () => {
    const project = buildProject([imageLayer(24), renderLayer({})]);
    const render = deriveProjectTracks(project).timelines![0].layers.find(
      (l) => l.type === LayerType.RENDER
    )!;
    expect(render.clips[0].asset.data.fps).toBe(24);
  });

  it("leaves render clips alone when source FPS is missing", () => {
    const project = buildProject([imageLayer(), renderLayer({})]);
    const render = deriveProjectTracks(project).timelines![0].layers.find(
      (l) => l.type === LayerType.RENDER
    )!;
    expect(render.clips[0].asset.data.fps).toBeUndefined();
  });

  it("returns an empty timelines array when source has none", () => {
    const project = { id: "p", timelines: undefined } as unknown as Project;
    expect(deriveProjectTracks(project).timelines).toEqual([]);
  });
});
