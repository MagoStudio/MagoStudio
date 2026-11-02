import { RenderMode } from "@hooks/types";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildRenderPayload } from "./buildRenderPayload";

const modelsWithoutTheVideoReferenceToggle = RENDER_MODELS.filter(
  (model) => model.capabilities.supportsVideoReferenceToggle !== true
).map((model) => [model.name, model] as const);

const buildSourcesFor = (
  model: VideoModelDefinition,
  useVideoReference: boolean | undefined
) =>
  buildRenderPayload({
    parentLayerId: "layer-1",
    frameRange: [0, 120],
    inputTrackId: "video-1",
    renderEngine: "magov2",
    renderMode: RenderMode.CREDITS,
    model,
    fps: 24,
    sources: [],
    renderSettings: {
      mago_engine: model.name as VideoEngine,
      ...(useVideoReference === undefined
        ? {}
        : { use_video_reference: useVideoReference })
    }
  }).sources;

describe("use_video_reference is inert for every model that does not declare the toggle", () => {
  it("has models to check, so an empty traversal cannot pass silently", () => {
    expect(modelsWithoutTheVideoReferenceToggle.length).toBeGreaterThan(0);
  });

  it.each(modelsWithoutTheVideoReferenceToggle)(
    "%s: a stale use_video_reference: false leaves the sources payload untouched",
    (_, model) => {
      expect(buildSourcesFor(model, false)).toEqual(
        buildSourcesFor(model, undefined)
      );
    }
  );
});
