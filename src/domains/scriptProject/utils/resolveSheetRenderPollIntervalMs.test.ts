import {
  ProjectState,
  ProjectStateSchema,
  SheetGroup,
  SheetImage
} from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveSheetRenderPollIntervalMs } from "./resolveSheetRenderPollIntervalMs";

const NOW_MS = Date.parse("2026-09-23T12:00:00.000+00:00");

const sheetImage = (
  assetId: string,
  status: string,
  createdAt: string | null
): SheetImage => ({
  asset_id: assetId,
  clip_id: `clip-${assetId}`,
  name: assetId,
  status,
  source: "render" as const,
  url: null,
  thumbnail_url: null,
  created_at: createdAt,
  has_description: false
});

const sheetGroup = (token: string, images: SheetImage[]): SheetGroup => ({
  token,
  name: token,
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: `layer-${token}`,
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images
});

const projectState = (keys: SheetGroup[]): ProjectState => ({
  project_id: "project-1",
  sheets_timeline_id: null,
  keys,
  shots: [],
  sequential_prompt_defaults: null
});

const resolve = (state: ProjectState | undefined) =>
  resolveSheetRenderPollIntervalMs({ projectState: state, nowMs: NOW_MS });

describe("resolveSheetRenderPollIntervalMs", () => {
  it("polls fast for a render created a minute ago", () => {
    expect(
      resolve(
        projectState([
          sheetGroup("medic", [
            sheetImage("v1", "created", "2026-09-23T11:59:00.000+00:00")
          ])
        ])
      )
    ).toBe(3000);
  });

  it("keeps polling, slower, for a render older than the fresh window", () => {
    expect(
      resolve(
        projectState([
          sheetGroup("medic", [
            sheetImage("v1", "created", "2026-09-23T11:30:00.000+00:00")
          ])
        ])
      )
    ).toBe(15_000);
  });

  it("keeps polling five minutes past the backend's one-hour give-up", () => {
    expect(
      resolve(
        projectState([
          sheetGroup("medic", [
            sheetImage("v1", "created", "2026-09-23T10:56:00.000+00:00")
          ])
        ])
      )
    ).toBe(15_000);
  });

  it("stops polling for a render older than an hour and five minutes", () => {
    expect(
      resolve(
        projectState([
          sheetGroup("medic", [
            sheetImage("v1", "created", "2026-09-23T10:54:00.000+00:00")
          ])
        ])
      )
    ).toBe(false);
  });

  it("polls slowly for a render with no usable created_at", () => {
    expect(
      resolve(
        projectState([sheetGroup("medic", [sheetImage("v1", "created", null)])])
      )
    ).toBe(15_000);
  });

  it.each(["success", "failed", "not_found"])(
    "does not poll for a %s image",
    (status) => {
      expect(
        resolve(
          projectState([
            sheetGroup("medic", [
              sheetImage("v1", status, "2026-09-23T11:59:00.000+00:00")
            ])
          ])
        )
      ).toBe(false);
    }
  );

  it("does not poll before the project state is loaded", () => {
    expect(resolve(undefined)).toBe(false);
  });

  it("polls fast when any one render is fresh", () => {
    expect(
      resolve(
        projectState([
          sheetGroup("medic", [
            sheetImage("v1", "created", "2026-09-23T11:30:00.000+00:00")
          ]),
          sheetGroup("sergeant", [
            sheetImage("v2", "IN_PROGRESS", "2026-09-23T11:59:00.000+00:00")
          ])
        ])
      )
    ).toBe(3000);
  });

  it("polls fast while a scene storyboard started a minute ago is generating", () => {
    const stateWithGeneratingStoryboard = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [],
      shots: [
        {
          timeline_id: "scene",
          shot_index: 0,
          sequence_id: 1,
          storyboard: {
            status: "generating",
            generating_started_at: "2026-09-23T11:59:00.000+00:00"
          }
        }
      ]
    });
    expect(resolve(stateWithGeneratingStoryboard)).toBe(3000);
  });

  it("stops polling once every scene storyboard has settled", () => {
    const stateWithReadyStoryboard = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [],
      shots: [
        {
          timeline_id: "scene",
          shot_index: 0,
          sequence_id: 1,
          storyboard: { status: "ready" }
        }
      ]
    });
    expect(resolve(stateWithReadyStoryboard)).toBe(false);
  });
});
