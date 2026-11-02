import { describe, expect, it } from "vitest";

import { resolveImageToVideoRenderContext } from "./resolveImageToVideoRenderContext";

const projectTree = () => [
  {
    id: "project-1",
    name: "My project",
    timelines: [
      {
        id: "shot-1",
        name: "Opening shot",
        layers: [
          {
            id: "source-track",
            clips: [{ asset: { id: "video-1", type: "VIDEO" } }]
          }
        ]
      },
      {
        id: "container-shot",
        name: "Image to Video",
        layers: [{ id: "earlier-i2v-track" }, { id: "i2v-output-track" }]
      }
    ]
  }
];

describe("resolveImageToVideoRenderContext", () => {
  it("finds the container shot that holds the output track, which has no source video", () => {
    expect(
      resolveImageToVideoRenderContext(projectTree(), {
        outputTrackId: "i2v-output-track"
      })
    ).toEqual({
      projectId: "project-1",
      projectName: "My project",
      shotId: "container-shot",
      shotName: "Image to Video",
      outputTrackId: "i2v-output-track"
    });
  });

  it("falls back to placeholder names when the project or shot is unnamed", () => {
    expect(
      resolveImageToVideoRenderContext(
        [
          {
            id: "project-1",
            timelines: [{ id: "container-shot", layers: [{ id: "output" }] }]
          }
        ],
        { outputTrackId: "output" }
      )
    ).toMatchObject({ projectName: "Untitled", shotName: "Shot" });
  });

  it("returns null when no shot holds the output track", () => {
    expect(
      resolveImageToVideoRenderContext(projectTree(), {
        outputTrackId: "missing-track"
      })
    ).toBeNull();
  });

  it("tolerates a malformed project tree", () => {
    expect(
      resolveImageToVideoRenderContext(null, { outputTrackId: "output" })
    ).toBeNull();
    expect(
      resolveImageToVideoRenderContext([null, { id: "project-1" }], {
        outputTrackId: "output"
      })
    ).toBeNull();
  });
});
