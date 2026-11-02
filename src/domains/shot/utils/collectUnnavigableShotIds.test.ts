import { LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { collectUnnavigableShotIds } from "./collectUnnavigableShotIds";

const shotWithImageTrack = (id: string) => ({
  id,
  layers: [{ type: LayerType.IMAGE }, { type: LayerType.RENDER }]
});

const shotWithOnlyRenderTracks = (id: string) => ({
  id,
  layers: [{ type: LayerType.RENDER }, { type: LayerType.RENDER }]
});

const projectWith = (
  timelines: unknown[],
  settings: Record<string, unknown> = {}
) =>
  ({ timelines, settings }) as unknown as Pick<
    Project,
    "timelines" | "settings"
  >;

describe("collectUnnavigableShotIds", () => {
  it("counts a Render Track that has no clips yet, so a just-submitted render still marks the shot", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([
          shotWithImageTrack("shot-a"),
          { id: "shot-i2v", layers: [{ type: LayerType.RENDER, clips: [] }] }
        ])
      )
    ).toEqual(["shot-i2v"]);
  });

  it("excludes the container shot from the project that reported this bug — two Render Tracks, no Image Track, no betaI2vShotId", () => {
    const reportedProject = projectWith(
      [
        {
          id: "a989d3b9-7448-4f0f-9a99-712a7aa64371",
          layers: [{ type: LayerType.IMAGE }, { type: LayerType.IMG2IMG }]
        },
        {
          id: "1824469d-3f91-4b86-98e2-ef53244eea06",
          layers: [{ type: LayerType.RENDER }, { type: LayerType.RENDER }]
        }
      ],
      { rangeMin: 0, rangeMax: 99 }
    );

    expect(collectUnnavigableShotIds(reportedProject)).toEqual([
      "1824469d-3f91-4b86-98e2-ef53244eea06"
    ]);
  });

  it("returns nothing for a project whose shots all have an Image Track", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([
          shotWithImageTrack("shot-a"),
          shotWithImageTrack("shot-b")
        ])
      )
    ).toEqual([]);
  });

  it("reports a shot that has only Render Tracks", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([
          shotWithImageTrack("shot-a"),
          shotWithOnlyRenderTracks("shot-i2v")
        ])
      )
    ).toEqual(["shot-i2v"]);
  });

  it("leaves an empty shot awaiting upload alone — no tracks yet is not a container shot", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([
          shotWithImageTrack("shot-a"),
          { id: "shot-awaiting-upload", layers: [] }
        ])
      )
    ).toEqual([]);
  });

  it("leaves a shot whose tracks field is missing alone, for the same reason", () => {
    expect(
      collectUnnavigableShotIds(projectWith([{ id: "shot-no-layers-field" }]))
    ).toEqual([]);
  });

  it("reports the container shot even when the project never registered it", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([
          shotWithImageTrack("shot-a"),
          shotWithOnlyRenderTracks("shot-i2v")
        ])
      )
    ).toEqual(["shot-i2v"]);
  });

  it("does not list the registered container shot twice", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith(
          [shotWithImageTrack("shot-a"), shotWithOnlyRenderTracks("shot-i2v")],
          { betaI2vShotId: "shot-i2v" }
        )
      )
    ).toEqual(["shot-i2v"]);
  });

  it("reports a registered container shot that is missing from the project's shots", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([shotWithImageTrack("shot-a")], {
          betaI2vShotId: "shot-not-loaded"
        })
      )
    ).toEqual(["shot-not-loaded"]);
  });

  it("returns nothing for an undefined project", () => {
    expect(collectUnnavigableShotIds(undefined)).toEqual([]);
  });

  it("returns nothing for a project with no shots", () => {
    expect(collectUnnavigableShotIds(projectWith([]))).toEqual([]);
  });

  it("still reports an empty shot when the project registered it as the container shot", () => {
    expect(
      collectUnnavigableShotIds(
        projectWith([{ id: "shot-i2v-no-renders-yet", layers: [] }], {
          betaI2vShotId: "shot-i2v-no-renders-yet"
        })
      )
    ).toEqual(["shot-i2v-no-renders-yet"]);
  });
});
