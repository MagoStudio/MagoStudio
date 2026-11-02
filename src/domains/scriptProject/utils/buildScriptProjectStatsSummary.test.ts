import { ProjectCut, ProjectState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildScriptProjectStatsSummary } from "./buildScriptProjectStatsSummary";
import { estimateCloudRenderCredits } from "./estimateCloudRenderCredits";
import { estimateLocalMagoCloudCredits } from "./estimateLocalMagoCloudCredits";

const buildProjectState = (
  overrides: Partial<ProjectState> = {}
): ProjectState =>
  ({
    project_id: "project-1",
    sheets_timeline_id: null,
    keys: [],
    shots: [],
    ...overrides
  }) as ProjectState;

const buildCut = (shots: unknown[]): ProjectCut =>
  ({
    project_id: "project-1",
    shots,
    missing: [],
    missing_timeline_ids: [],
    hidden_shots: [],
    export: null
  }) as ProjectCut;

describe("buildScriptProjectStatsSummary", () => {
  it("retains video counts and credit estimates when a shot is hidden", () => {
    const cut = buildCut([
      {
        timeline_id: "shot-1",
        asset_id: "video-1",
        url: "https://cdn/video.mp4",
        versions: [
          {
            asset_id: "video-1",
            ready: true,
            status: "success",
            render_spec: {
              output_size: [1280, 720],
              duration_s: 5,
              engine: "minimax_h3_max"
            }
          }
        ]
      }
    ]);
    const hiddenCut = { ...cut, shots: [], hidden_shots: cut.shots };
    const summary = buildScriptProjectStatsSummary({ cut });
    expect(summary.renderedVideoCount).toBe(1);
    expect(summary.estimatedVideoCredits).toBeGreaterThan(0);
    expect(buildScriptProjectStatsSummary({ cut: hiddenCut })).toEqual(summary);
    expect(estimateCloudRenderCredits(undefined, hiddenCut)).toBe(
      estimateCloudRenderCredits(undefined, cut)
    );
    expect(estimateLocalMagoCloudCredits(hiddenCut)).toBe(
      estimateLocalMagoCloudCredits(cut)
    );
    expect(
      buildScriptProjectStatsSummary({
        cut: { ...hiddenCut, shots: cut.shots }
      })
    ).toEqual(summary);
  });

  it("returns zeros when nothing has loaded", () => {
    expect(buildScriptProjectStatsSummary({})).toEqual({
      assetCount: 0,
      assetImageCount: 0,
      sequenceCount: 0,
      shotCount: 0,
      renderedVideoCount: 0,
      estimatedImageCredits: 0,
      estimatedVideoCredits: 0,
      totalCostInCredits: 0
    });
  });

  it("counts assets and their images", () => {
    const summary = buildScriptProjectStatsSummary({
      projectState: buildProjectState({
        keys: [{ images: [{}, {}] }, { images: [{}] }] as never
      })
    });

    expect(summary.assetCount).toBe(2);
    expect(summary.assetImageCount).toBe(3);
  });

  it("ignores dropped shots and counts distinct sequences", () => {
    const summary = buildScriptProjectStatsSummary({
      projectState: buildProjectState({
        shots: [
          { sequence_id: 1, dropped: false },
          { sequence_id: 1, dropped: false },
          { sequence_id: 2, dropped: false },
          { sequence_id: 3, dropped: true }
        ] as never
      })
    });

    expect(summary.shotCount).toBe(3);
    expect(summary.sequenceCount).toBe(2);
  });

  it("counts each rendered video asset once across shots and versions", () => {
    const summary = buildScriptProjectStatsSummary({
      cut: buildCut([
        {
          asset_id: "asset-a",
          url: "https://cdn/a.mp4",
          versions: [
            { asset_id: "asset-a", ready: true, status: "success", url: null },
            { asset_id: "asset-b", ready: false, status: "SUCCESS", url: null },
            { asset_id: "asset-c", ready: false, status: "pending", url: null }
          ]
        },
        { asset_id: null, url: null, versions: [] }
      ])
    });

    expect(summary.renderedVideoCount).toBe(2);
  });

  it("ignores rendered videos of dropped shots", () => {
    const summary = buildScriptProjectStatsSummary({
      projectState: buildProjectState({
        shots: [
          { timeline_id: "kept", sequence_id: 1, dropped: false },
          { timeline_id: "dropped", sequence_id: 2, dropped: true }
        ] as never
      }),
      cut: buildCut([
        {
          timeline_id: "kept",
          asset_id: "a",
          url: "https://cdn/a.mp4",
          versions: []
        },
        {
          timeline_id: "dropped",
          asset_id: "b",
          url: "https://cdn/b.mp4",
          versions: []
        }
      ])
    });

    expect(summary.renderedVideoCount).toBe(1);
  });

  it("passes the total cost through in credits", () => {
    expect(
      buildScriptProjectStatsSummary({ totalCostInCredits: 12.5 })
        .totalCostInCredits
    ).toBe(12.5);
  });
});
