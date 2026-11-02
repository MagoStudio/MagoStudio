import { describe, expect, it } from "vitest";

import { resolveRenderContext } from "./resolveRenderContext";

/** Shaped like what projects.listAll returns from the local library. */
const tree = () => [
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
            clips: [
              {
                asset_id: "video-1",
                asset: { id: "video-1", name: "take 1", type: "VIDEO" }
              }
            ]
          },
          { id: "output-track", clips: [] }
        ]
      },
      {
        id: "shot-2",
        name: "Second shot",
        layers: [
          {
            id: "other-source",
            clips: [
              {
                asset_id: "video-2",
                asset: { id: "video-2", name: "take 2", type: "VIDEO" }
              }
            ]
          },
          { id: "other-output", clips: [] }
        ]
      }
    ]
  }
];

describe("resolveRenderContext", () => {
  it("derives the project, shot and source video from two track ids", () => {
    expect(
      resolveRenderContext(tree(), {
        outputTrackId: "output-track",
        inputTrackId: "source-track"
      })
    ).toEqual({
      projectId: "project-1",
      projectName: "My project",
      shotId: "shot-1",
      shotName: "Opening shot",
      assetId: "video-1",
      assetName: "take 1",
      outputTrackId: "output-track"
    });
  });

  it("picks the shot that owns the output track, not merely the first", () => {
    const context = resolveRenderContext(tree(), {
      outputTrackId: "other-output",
      inputTrackId: "other-source"
    });

    expect(context?.shotId).toBe("shot-2");
    expect(context?.assetId).toBe("video-2");
  });

  it("falls back to the shot's own video when the input track is unknown", () => {
    const context = resolveRenderContext(tree(), {
      outputTrackId: "output-track",
      inputTrackId: "does-not-exist"
    });

    expect(context?.assetId).toBe("video-1");
  });

  it("ignores generated images when looking for the source video", () => {
    // A shot with img2img output must still resolve to the video being rendered.
    const withImages = [
      {
        id: "project-1",
        name: "P",
        timelines: [
          {
            id: "shot-1",
            name: "S",
            layers: [
              {
                id: "img2img",
                clips: [
                  { asset: { id: "image-1", name: "frame", type: "IMAGE" } }
                ]
              },
              {
                id: "source-track",
                clips: [
                  { asset: { id: "video-1", name: "take", type: "VIDEO" } }
                ]
              },
              { id: "output-track", clips: [] }
            ]
          }
        ]
      }
    ];

    const context = resolveRenderContext(withImages, {
      outputTrackId: "output-track",
      inputTrackId: "img2img"
    });

    expect(context?.assetId).toBe("video-1");
  });

  it("returns null when the output track is nowhere in the library", () => {
    expect(
      resolveRenderContext(tree(), {
        outputTrackId: "missing",
        inputTrackId: "source-track"
      })
    ).toBeNull();
  });

  it("returns null when the shot has no video to render from", () => {
    const empty = [
      {
        id: "p",
        name: "P",
        timelines: [
          { id: "s", name: "S", layers: [{ id: "output-track", clips: [] }] }
        ]
      }
    ];

    expect(
      resolveRenderContext(empty, {
        outputTrackId: "output-track",
        inputTrackId: "none"
      })
    ).toBeNull();
  });

  it("survives a malformed tree rather than throwing", () => {
    for (const projects of [
      null,
      undefined,
      {},
      [null],
      [{ id: 1 }],
      [{ id: "p" }]
    ]) {
      expect(
        resolveRenderContext(projects, {
          outputTrackId: "output-track",
          inputTrackId: "source-track"
        })
      ).toBeNull();
    }
  });

  it("falls back to placeholder names rather than failing", () => {
    const unnamed = [
      {
        id: "p",
        timelines: [
          {
            id: "s",
            layers: [
              { id: "src", clips: [{ asset: { id: "v", type: "VIDEO" } }] },
              { id: "output-track", clips: [] }
            ]
          }
        ]
      }
    ];

    const context = resolveRenderContext(unnamed, {
      outputTrackId: "output-track",
      inputTrackId: "src"
    });

    expect(context?.projectName).toBe("Untitled");
    expect(context?.shotName).toBe("Shot");
    expect(context?.assetName).toBe("clip");
  });
});
