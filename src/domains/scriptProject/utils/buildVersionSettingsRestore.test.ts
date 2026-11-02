import { CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildVersionSettingsRestore } from "./buildVersionSettingsRestore";

const version = (spec: Record<string, unknown> | null): CutShotVersion => ({
  layer_id: "layer",
  asset_id: "take",
  ready: true,
  status: "finished",
  url: null,
  poster_url: null,
  render_spec: spec
});
describe("reusing backend shot provenance", () => {
  it("restores the prompt, duration, references and continuation preference", () => {
    expect(
      buildVersionSettingsRestore(
        version({
          video_prompt: "Tracking shot",
          settings: { frame_range: [0, 143] },
          references: {
            characters: ["hero-image"],
            environments: [],
            props: []
          },
          sequential: { enabled: true, mode: "key_frames", num_select: 2 }
        }),
        new Map([["hero-image", "hero"]])
      )
    ).toEqual({
      videoPrompt: "Tracking shot",
      durationSeconds: 6,
      tags: { characters: ["hero"], environments: [], props: [] },
      sequential: { enabled: true, mode: "key_frames", num_select: 2 }
    });
  });
  it("refuses to silently drop references that no longer belong to enabled entities", () => {
    expect(
      buildVersionSettingsRestore(
        version({
          video_prompt: "old",
          references: {
            characters: ["removed-image"],
            environments: [],
            props: []
          }
        }),
        new Map()
      )
    ).toBeNull();
  });
  it("does not expose a restore for a take without provenance", () => {
    expect(buildVersionSettingsRestore(version(null), new Map())).toBeNull();
  });
});

it("retains older desktop provenance and falls back to its saved duration", () => {
  const saved = {
    ...version(null),
    input_settings: {
      _local_render_spec: { video_prompt: "Saved desktop prompt" },
      duration_s: 6
    }
  };
  expect(buildVersionSettingsRestore(saved, new Map())).toMatchObject({
    videoPrompt: "Saved desktop prompt",
    durationSeconds: 6
  });
});
