import { Img2ImgRenderResponse } from "@models/img2img/types";
import { Layer, LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";
import { describe, expect, it } from "vitest";

import { mergeImg2ImgLayerIntoProject } from "./mergeImg2ImgLayerIntoProject";

const SHOT_ID = "shot-1";
const OTHER_SHOT_ID = "shot-2";
const IMG2IMG_LAYER_ID = "img2img-layer-1";
const IMAGE_LAYER_ID = "image-layer-1";

const buildResponse = (
  overrides: Partial<Img2ImgRenderResponse> = {},
  clipId = "clip-new"
): Img2ImgRenderResponse => ({
  id: IMG2IMG_LAYER_ID,
  timeline_id: SHOT_ID,
  type: "IMG2IMG",
  user_id: "user-1",
  clips: [
    {
      id: clipId,
      data: {
        source: "src-1",
        frame: 0,
        render_job_id: "job-1",
        settings: {
          render_model: "nanobanana_pro",
          reference_images: [],
          width: 1080,
          height: 1920
        },
        status: "created"
      },
      asset: {
        id: "asset-new",
        type: "IMAGE",
        filepath: "uploads/new.jpg"
      }
    }
  ],
  ...overrides
});

const buildLayer = (overrides: Partial<Layer>): Layer =>
  ({
    id: "layer-x",
    name: "",
    timeline_id: SHOT_ID,
    user_id: "user-1",
    type: LayerType.RENDER,
    active: true,
    muted: false,
    visible: true,
    layer_order: 1,
    rating: 0,
    created_at: new Date("2026-01-01"),
    data: {},
    clips: [],
    ...overrides
  }) as Layer;

const buildShot = (overrides: Partial<Shot>): Shot =>
  ({
    id: SHOT_ID,
    name: "Default",
    project_id: "project-1",
    user_id: "user-1",
    active: true,
    settings: {},
    layers: [],
    ...overrides
  }) as Shot;

const buildProject = (timelines: Shot[]): Project =>
  ({
    id: "project-1",
    name: "p",
    description: "",
    active: true,
    settings: {},
    timelines
  }) as Project;

describe("mergeImg2ImgLayerIntoProject", () => {
  it("appends the new clip to an existing IMG2IMG layer matched by id", () => {
    const existingClip = { id: "clip-existing" } as Layer["clips"][number];
    const project = buildProject([
      buildShot({
        layers: [
          buildLayer({
            id: IMG2IMG_LAYER_ID,
            type: LayerType.IMG2IMG,
            clips: [existingClip]
          })
        ]
      })
    ]);

    const result = mergeImg2ImgLayerIntoProject(project, buildResponse());

    const layer = result!.timelines![0].layers[0];
    expect(layer.id).toBe(IMG2IMG_LAYER_ID);
    expect(layer.clips).toHaveLength(2);
    expect(layer.clips[0].id).toBe("clip-existing");
    expect(layer.clips[1].id).toBe("clip-new");
  });

  it("inserts a new IMG2IMG layer with defaults when none matches", () => {
    const project = buildProject([
      buildShot({
        layers: [buildLayer({ id: IMAGE_LAYER_ID, type: LayerType.IMAGE })]
      })
    ]);

    const result = mergeImg2ImgLayerIntoProject(project, buildResponse());

    const layers = result!.timelines![0].layers;
    expect(layers).toHaveLength(2);
    const inserted = layers[1];
    expect(inserted.id).toBe(IMG2IMG_LAYER_ID);
    expect(inserted.type).toBe(LayerType.IMG2IMG);
    expect(inserted.name).toBe("");
    expect(inserted.active).toBe(true);
    expect(inserted.muted).toBe(false);
    expect(inserted.visible).toBe(true);
    expect(inserted.layer_order).toBe(2);
    expect(inserted.rating).toBe(0);
    expect(inserted.data).toEqual({});
    expect(inserted.clips).toHaveLength(1);
    expect(inserted.clips[0].id).toBe("clip-new");
  });

  it("leaves other shots and their layers untouched", () => {
    const otherLayer = buildLayer({ id: "other-layer" });
    const project = buildProject([
      buildShot({ layers: [] }),
      buildShot({ id: OTHER_SHOT_ID, layers: [otherLayer] })
    ]);

    const result = mergeImg2ImgLayerIntoProject(project, buildResponse());

    expect(result!.timelines![1]).toBe(project.timelines![1]);
    expect(result!.timelines![1].layers[0]).toBe(otherLayer);
  });

  it("returns the project unchanged when the timeline_id does not match any shot", () => {
    const project = buildProject([buildShot({ id: OTHER_SHOT_ID })]);

    const result = mergeImg2ImgLayerIntoProject(project, buildResponse());

    expect(result).toBe(project);
  });

  it("stamps a fresh asset.created_at on merged clips so newest-first sort works", () => {
    const project = buildProject([
      buildShot({
        layers: [buildLayer({ id: IMG2IMG_LAYER_ID, type: LayerType.IMG2IMG })]
      })
    ]);

    const before = Date.now();
    const result = mergeImg2ImgLayerIntoProject(project, buildResponse());
    const after = Date.now();

    const stamped = result!.timelines![0].layers[0].clips[0].asset.created_at;
    const stampedTime = new Date(stamped).getTime();
    expect(stampedTime).toBeGreaterThanOrEqual(before);
    expect(stampedTime).toBeLessThanOrEqual(after);
  });

  it("appends every clip when the response carries multiple clips", () => {
    const project = buildProject([
      buildShot({
        layers: [buildLayer({ id: IMG2IMG_LAYER_ID, type: LayerType.IMG2IMG })]
      })
    ]);
    const response = buildResponse();
    response.clips = [
      { ...response.clips[0], id: "clip-a" },
      { ...response.clips[0], id: "clip-b" }
    ];

    const result = mergeImg2ImgLayerIntoProject(project, response);

    const layer = result!.timelines![0].layers[0];
    expect(layer.clips.map((c) => c.id)).toEqual(["clip-a", "clip-b"]);
  });

  it("returns project unchanged when project is undefined", () => {
    const result = mergeImg2ImgLayerIntoProject(undefined, buildResponse());
    expect(result).toBeUndefined();
  });
});
