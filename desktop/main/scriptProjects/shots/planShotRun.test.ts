import { describe, expect, it } from "vitest";

import { changedFields } from "../renderSpec";

import {
  planShotRun,
  sequentialShotConfig,
  ShotRunError,
  shotSpecsInFlight
} from "./planShotRun";
import {
  SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION,
  SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION_CUT
} from "./sequentialContinuation";

const shot = (index: number, overrides: Record<string, unknown> = {}) => ({
  timeline_id: `shot-${index}`,
  shot_index: index - 1,
  sequence_id: index,
  key: String(index),
  dropped: false,
  video_prompt: `Shot ${index}.`,
  duration_s: 6,
  references: { characters: [{ token: "pilot", asset_id: "sheet-1" }] },
  missing_references: [],
  ...overrides
});

const SETTINGS = { engine: "minimax_h3_max", frame_range: [0, 144] };

const plan = (
  shots: Record<string, unknown>[],
  request: Record<string, unknown> = {},
  extra: {
    cutShots?: Record<string, unknown>[];
    inFlight?: Map<string, Set<string>>;
  } = {}
) =>
  planShotRun({
    shots,
    cutShots: extra.cutShots ?? [],
    request: { videoSettings: SETTINGS, outputSize: [1280, 720], ...request },
    inFlight: extra.inFlight ?? new Map()
  });

const rendered = (
  timelineId: string,
  fingerprint: string,
  assetId = "video-1"
) => ({
  timeline_id: timelineId,
  asset_id: assetId,
  versions: [{ asset_id: assetId, ready: true, fingerprint }]
});

describe("planShotRun", () => {
  it("includes visual style in the spec and keeps empty-style fingerprints stable", () => {
    const original = plan([shot(1)]).planned[0]!.renderSpec;
    expect(
      plan([shot(1)], { visualStyle: " " }).planned[0]!.renderSpec
    ).toEqual(original);
    const styled = plan([shot(1)], { visualStyle: "  Ink on paper  " })
      .planned[0]!.renderSpec;
    expect(styled.spec.settings).toMatchObject({
      visual_style: "Ink on paper"
    });
    expect(styled.fingerprint).not.toBe(original.fingerprint);
    expect(changedFields(original.spec, styled.spec)).toContain(
      "settings.visual_style"
    );
  });
  it("reports dropped and locked shots as skipped and missing references as blocked", () => {
    const run = plan([
      shot(1, { dropped: true }),
      shot(2, { locked: true }),
      shot(3, { missing_references: [{ token: "pilot", reason: "no_image" }] }),
      shot(4)
    ]);
    expect(run.preview.skipped).toEqual([
      { sequence_id: 1, key: "1", timeline_id: "shot-1", reason: "dropped" },
      { sequence_id: 2, key: "2", timeline_id: "shot-2", reason: "locked" }
    ]);
    expect(run.preview.blocked).toEqual([
      {
        sequence_id: 3,
        key: "3",
        timeline_id: "shot-3",
        missing: [{ token: "pilot", reason: "no_image" }]
      }
    ]);
    expect(run.preview.would_run_timeline_ids).toEqual(["shot-4"]);
  });

  it("filters on sequence ids OR timeline ids", () => {
    const run = plan([shot(1), shot(2), shot(3)], {
      sequenceIds: [1],
      timelineIds: ["shot-3"]
    });
    expect(run.preview.would_run_keys).toEqual(["1", "3"]);
  });

  it("ignores continuity on the first shot and blocks one with nothing to continue from", () => {
    const run = plan([shot(1), shot(2)], {
      timelineIds: ["shot-1", "shot-2"],
      sequential: { default: { enabled: true } }
    });
    expect(run.preview.sequential_ignored).toEqual([
      { sequence_id: 1, key: "1", timeline_id: "shot-1", reason: "first shot" }
    ]);
    // Shot 1 renders in this run, so shot 2 waits for it.
    expect(run.planned[1]).toEqual(
      expect.objectContaining({
        previousTimelineId: "shot-1",
        previousInRun: true,
        sequential: {
          mode: "last_frame",
          prompt_appendix: SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION_CUT
        }
      })
    );
    expect(
      run.planned[1]!.renderSpec.spec.sequential as Record<string, unknown>
    ).toEqual(
      expect.objectContaining({
        prompt_appendix: SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION
      })
    );

    const alone = plan([shot(1), shot(2)], {
      timelineIds: ["shot-2"],
      sequential: { default: { enabled: true } }
    });
    expect(alone.preview.blocked).toEqual([
      expect.objectContaining({
        timeline_id: "shot-2",
        missing: [],
        reason_code: "predecessor_not_rendered"
      })
    ]);
  });

  it("continues from the predecessor's pin when it is not rendering", () => {
    const run = plan(
      [shot(1), shot(2, { sequential: { enabled: true, mode: "last_chunk" } })],
      {
        timelineIds: ["shot-2"]
      },
      { cutShots: [rendered("shot-1", "sha256:x", "video-1")] }
    );
    expect(run.planned).toHaveLength(1);
    expect(run.planned[0]!.previousInRun).toBe(false);
    expect(run.planned[0]!.renderSpec.spec.sequential).toEqual(
      expect.objectContaining({
        mode: "last_chunk",
        chunk_seconds: 2,
        prev_asset_id: "video-1"
      })
    );
  });

  it("blocks a shot outside the 5-15 s window and refuses the real run", () => {
    const run = plan([shot(1, { duration_s: 4.6 }), shot(2)]);
    expect(run.preview.blocked).toEqual([
      {
        sequence_id: 1,
        key: "1",
        timeline_id: "shot-1",
        missing: [],
        reason_code: "duration_out_of_range",
        reason: "minimax_h3_local renders 5-15s; this shot is 4.6s"
      }
    ]);
    expect(run.durationError).toBe(
      "shot 1: minimax_h3_local renders 5-15s; this shot is 4.6s"
    );
  });

  it("renders a shot with no length at the plan length, reported only as the odd one out", () => {
    const run = plan([shot(1, { duration_s: null }), shot(2)]);
    expect(run.preview.duration_missing).toEqual([
      { sequence_id: 1, key: "1", timeline_id: "shot-1", duration_s: 6 }
    ]);
    expect(run.planned.map((planned) => planned.durationSeconds)).toEqual([
      6, 6
    ]);
    const uncalibrated = plan([shot(1, { duration_s: null })]);
    expect(uncalibrated.preview.duration_missing).toEqual([]);
  });

  it("validates prompt_rewrite and keeps the default pair out of the spec", () => {
    expect(() =>
      plan([shot(1)], {
        videoSettings: { ...SETTINGS, adapt_video_prompt: false }
      })
    ).toThrow(
      "adapt_video_prompt is not settable here; use prompt_rewrite (mago, raw)"
    );
    expect(() =>
      plan([shot(1)], {
        videoSettings: { ...SETTINGS, prompt_rewrite: "fal_quality" }
      })
    ).toThrow(ShotRunError);
    expect(() => plan([shot(1, { prompt_rewrite: "fal_balanced" })])).toThrow(
      "shot 1: prompt_rewrite must be one of: mago, raw (on engine minimax_h3_local)"
    );

    const byDefault = plan([shot(1)], {
      videoSettings: { ...SETTINGS, prompt_rewrite: "mago" }
    });
    expect(byDefault.planned[0]!.renderSpec.spec.settings).toEqual({
      ...SETTINGS,
      duration_s: 6
    });
    expect(byDefault.planned[0]!.renderSpec.fingerprint).toBe(
      plan([shot(1)]).planned[0]!.renderSpec.fingerprint
    );

    const rawShot = plan([shot(1, { prompt_rewrite: "raw" })]);
    expect(rawShot.planned[0]!.promptRewrite).toBe("raw");
    expect(rawShot.planned[0]!.renderSpec.spec.settings).toEqual(
      expect.objectContaining({ adapt_video_prompt: false })
    );
  });

  it("skips a shot already rendered with these inputs or being rendered now", () => {
    const first = plan([shot(1), shot(2)]);
    const [one, two] = first.planned.map(
      (planned) => planned.renderSpec.fingerprint
    );
    const run = plan(
      [shot(1), shot(2)],
      {},
      {
        cutShots: [rendered("shot-1", one!)],
        inFlight: new Map([["shot-2", new Set([two!])]])
      }
    );
    expect(run.preview.skipped).toEqual([
      expect.objectContaining({
        timeline_id: "shot-1",
        reason: "already rendered with these inputs"
      }),
      expect.objectContaining({
        timeline_id: "shot-2",
        reason: "render already in progress"
      })
    ]);
    // Whitespace is not an input.
    const respaced = plan(
      [shot(1, { video_prompt: "  Shot   1. " })],
      {},
      {
        cutShots: [rendered("shot-1", one!)]
      }
    );
    expect(respaced.planned).toEqual([]);
  });

  it("says what changed since the last request", () => {
    const first = plan([shot(1)]);
    const run = plan([
      shot(1, { duration_s: 8, last_spec: first.planned[0]!.renderSpec.spec })
    ]);
    expect(run.preview.changed).toEqual({ "1": ["settings.duration_s"] });
    expect(run.preview.changed_by_timeline_id).toEqual({
      "shot-1": ["settings.duration_s"]
    });
  });
});

describe("planShotRun scene list rules", () => {
  it("skips a hidden shot in a bulk run but renders it when named", () => {
    const bulk = plan([shot(1), shot(2, { hidden: true })]);
    expect(bulk.preview.skipped).toEqual([
      { sequence_id: 2, key: "2", timeline_id: "shot-2", reason: "hidden" }
    ]);

    const named = plan([shot(1), shot(2, { hidden: true })], {
      timelineIds: ["shot-2"]
    });
    expect(named.preview.would_run_timeline_ids).toEqual(["shot-2"]);
  });

  it("continues from the shot before a hidden one", () => {
    const run = plan(
      [shot(1), shot(2, { hidden: true }), shot(3)],
      {
        timelineIds: ["shot-3"],
        sequential: { default: { enabled: true } }
      },
      { cutShots: [rendered("shot-1", "done")] }
    );
    expect(run.planned[0]!.previousTimelineId).toBe("shot-1");
  });

  it("blocks a shot with no prompt", () => {
    const run = plan([shot(1, { video_prompt: "  " })]);
    expect(run.preview.blocked).toEqual([
      expect.objectContaining({
        timeline_id: "shot-1",
        reason_code: "no_prompt"
      })
    ]);
  });

  it("blocks a non-sequential shot with no reference image, also in the dry run", () => {
    const run = plan([shot(1, { references: {} })]);
    expect(run.preview.blocked).toEqual([
      expect.objectContaining({
        timeline_id: "shot-1",
        reason_code: "no_reference_image"
      })
    ]);
    expect(run.planned).toEqual([]);
  });

  it("lets a sequential shot with no reference image continue from its predecessor", () => {
    const run = plan(
      [shot(1), shot(2, { references: {}, sequential: { enabled: true } })],
      {},
      { cutShots: [rendered("shot-1", "done")] }
    );
    expect(run.preview.would_run_timeline_ids).toContain("shot-2");
  });

  it("plans a hand-added shot that belongs to no sequence", () => {
    const run = plan([shot(1, { sequence_id: null, key: "manual-abc" })]);
    expect(run.preview.would_run).toEqual([null]);
    expect(run.preview.would_run_keys).toEqual(["manual-abc"]);
  });
});

describe("sequentialShotConfig", () => {
  it("defaults a last-frame shot to cut and keeps another opening frame", () => {
    expect(sequentialShotConfig({ enabled: true }, null, null)).toEqual([
      {
        mode: "last_frame",
        prompt_appendix: SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION_CUT
      },
      null
    ]);
    expect(
      sequentialShotConfig(
        { enabled: true, opening_frame: "pin" },
        null,
        null
      )[0]
    ).toEqual(expect.objectContaining({ opening_frame: "pin" }));
    expect(
      sequentialShotConfig(
        { enabled: true, opening_frame: "sideways" },
        null,
        null
      )[1]
    ).toBe("sequential.opening_frame must be one of cut, pin, off");
  });

  it("treats a default text saved back as the default, so it follows the opening frame", () => {
    const [config] = sequentialShotConfig(
      {
        enabled: true,
        opening_frame: "off",
        prompt_appendix: SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION_CUT
      },
      null,
      null
    );
    expect(config?.prompt_appendix).toBe(SEQUENTIAL_SHOT_REFERENCE_DESCRIPTION);
  });

  it("merges run default < persisted < run entry and keeps only the mode's knobs", () => {
    expect(
      sequentialShotConfig(
        { enabled: true, mode: "key_frames", chunk_seconds: 3 },
        { num_select: 3 },
        { enabled: false, prompt_appendix: " Match it. " }
      )
    ).toEqual([
      { mode: "key_frames", prompt_appendix: "Match it.", num_select: 3 },
      null
    ]);
    expect(
      sequentialShotConfig({ enabled: true }, { enabled: false }, {})
    ).toEqual([null, null]);
  });

  it("refuses knobs out of range", () => {
    expect(
      sequentialShotConfig({ enabled: true, mode: "sideways" }, null, null)[1]
    ).toBe("sequential.mode must be one of last_frame, key_frames, last_chunk");
    expect(
      sequentialShotConfig(
        { enabled: true, mode: "key_frames", num_select: 5 },
        null,
        null
      )[1]
    ).toBe("sequential.num_select must be an integer in 1..4");
    expect(
      sequentialShotConfig(
        { enabled: true, mode: "last_chunk", chunk_seconds: 11 },
        null,
        null
      )[1]
    ).toBe("sequential.chunk_seconds must be a number in 0..10.0");
  });
});

describe("shotSpecsInFlight", () => {
  it("holds live plans' fingerprints except on a timeline the plan gave up on", () => {
    const target = (timelineId: string, fingerprint: string) => ({
      timeline_id: timelineId,
      _local_render_spec: { fingerprint }
    });
    const inFlight = shotSpecsInFlight([
      {
        status: "RUNNING",
        steps: [{ timeline_id: "shot-2", status: "FAILED" }],
        local_targets: [target("shot-1", "a"), target("shot-2", "b")]
      },
      { status: "COMPLETED", local_targets: [target("shot-3", "c")] }
    ]);
    expect([...inFlight.entries()]).toEqual([["shot-1", new Set(["a"])]]);
  });

  it("releases every shot of a paused plan, which local cannot resume from the panel", () => {
    const inFlight = shotSpecsInFlight([
      {
        status: "PAUSED",
        steps: [],
        local_targets: [
          { timeline_id: "shot-1", _local_render_spec: { fingerprint: "a" } }
        ]
      }
    ]);
    expect(inFlight.size).toBe(0);
  });
});

describe("changedFields", () => {
  it("is empty with nothing to compare against", () => {
    expect(changedFields(undefined, { a: 1 })).toEqual([]);
    expect(
      changedFields({ a: { b: 1 }, c: 2 }, { a: { b: 2 }, c: 2, d: 1 })
    ).toEqual(["a.b", "d"]);
  });
});
