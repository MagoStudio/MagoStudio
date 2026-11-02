import { describe, expect, it } from "vitest";

import {
  ProjectCutSchema,
  GetScriptChatMessagesResponseSchema,
  ProjectStateSchema,
  ScriptVersionListSchema,
  ShotGenerateResultSchema
} from "./scriptProject";

const versionListWithSummary = (summary: unknown) => ({
  active_version: 1,
  versions: [
    {
      version: 1,
      plan_id: "plan-1",
      created_at: "2026-09-09T10:00:00Z",
      max_shots: 30,
      status: "COMPLETED",
      summary
    }
  ]
});

describe("ScriptVersionListSchema", () => {
  it("accepts the atomic beat ids a shot summary can carry", () => {
    const parsed = ScriptVersionListSchema.parse(
      versionListWithSummary({
        keys_added: ["medic"],
        keys_kept: [],
        keys_unused: [],
        shots_added: ["3.1", "3.2"],
        shots_kept: [],
        shots_dropped: [],
        dropped_entities: []
      })
    );

    expect(parsed.versions[0]?.summary?.shots_added).toEqual(["3.1", "3.2"]);
  });

  it("accepts a list mixing sequence ids with atomic beat ids", () => {
    const parsed = ScriptVersionListSchema.parse(
      versionListWithSummary({
        keys_added: [],
        keys_kept: [],
        keys_unused: [],
        shots_added: [],
        shots_kept: [],
        shots_dropped: [1, "2.1", 3],
        dropped_entities: []
      })
    );

    expect(parsed.versions[0]?.summary?.shots_dropped).toEqual([1, "2.1", 3]);
  });

  it("keeps the version when the summary is a shape it does not recognise", () => {
    const parsed = ScriptVersionListSchema.parse(
      versionListWithSummary({ shots_added: "not even a list" })
    );

    expect(parsed.active_version).toBe(1);
    expect(parsed.versions).toHaveLength(1);
    expect(parsed.versions[0]?.summary).toBeNull();
  });

  it("still reads a version with no summary at all", () => {
    const parsed = ScriptVersionListSchema.parse(versionListWithSummary(null));

    expect(parsed.versions[0]?.status).toBe("COMPLETED");
    expect(parsed.versions[0]?.summary).toBeNull();
  });

  it("preserves the casting options recorded on a script version", () => {
    const parsed = ScriptVersionListSchema.parse({
      active_version: 1,
      versions: [
        {
          ...versionListWithSummary(null).versions[0],
          atomic_shots: true,
          sequential_shots: false,
          split_alts: true,
          separate_style: true,
          separate_camera: false
        }
      ]
    });

    expect(parsed.versions[0]).toMatchObject({
      atomic_shots: true,
      sequential_shots: false,
      split_alts: true,
      separate_style: true,
      separate_camera: false
    });
  });
});

const projectStateWithShotKey = (key: unknown) => ({
  project_id: "project-1",
  sheets_timeline_id: null,
  keys: [],
  shots: [{ timeline_id: "timeline-8", shot_index: 0, sequence_id: 8, key }]
});

describe("ProjectStateSchema", () => {
  it("reads the atomic beat id a Shot key carries", () => {
    const parsed = ProjectStateSchema.parse(projectStateWithShotKey("8.1"));

    expect(parsed.shots[0]?.key).toBe("8.1");
  });

  it("reads a non-atomic Shot key sent as a number, as a string", () => {
    const parsed = ProjectStateSchema.parse(projectStateWithShotKey(8));

    expect(parsed.shots[0]?.key).toBe("8");
  });

  it("still reads a Shot written before keys existed", () => {
    const parsed = ProjectStateSchema.parse(projectStateWithShotKey(null));

    expect(parsed.shots[0]?.key).toBeNull();
  });

  it("keeps the readable Shots and drops only the one it cannot read", () => {
    const parsed = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [],
      shots: [
        { timeline_id: "timeline-8", shot_index: 0, sequence_id: 8 },
        {
          timeline_id: "timeline-9",
          shot_index: 1,
          sequence_id: "not a number"
        },
        { timeline_id: "timeline-10", shot_index: 2, sequence_id: 10 }
      ]
    });

    expect(parsed.shots.map((shot) => shot.timeline_id)).toEqual([
      "timeline-8",
      "timeline-10"
    ]);
  });

  it("keeps the project when a reference-sheet group is unreadable", () => {
    const parsed = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [{ token: 42 }],
      shots: [{ timeline_id: "timeline-8", shot_index: 0, sequence_id: 8 }]
    });

    expect(parsed.project_id).toBe("project-1");
    expect(parsed.keys).toEqual([]);
    expect(parsed.shots).toHaveLength(1);
  });

  it("keeps the project when a list is not a list at all", () => {
    const parsed = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: {},
      shots: "gone"
    });

    expect(parsed.project_id).toBe("project-1");
    expect(parsed.keys).toEqual([]);
    expect(parsed.shots).toEqual([]);
  });

  it("reads a Shot stored with the removed Video ending mode as Last frame", () => {
    const parsed = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [],
      shots: [
        {
          timeline_id: "timeline-8",
          shot_index: 0,
          sequence_id: 8,
          sequential: { enabled: true, mode: "last_chunk" }
        }
      ]
    });

    expect(parsed.shots[0]?.sequential?.mode).toBe("last_frame");
  });
});

describe("GetScriptChatMessagesResponseSchema", () => {
  it("keeps the readable rows and drops only the one it cannot read", () => {
    const parsed = GetScriptChatMessagesResponseSchema.parse({
      project_id: "project-1",
      pending: false,
      messages: [
        {
          id: "row-1",
          role: "user",
          status: "COMPLETED",
          content: "An idea",
          created_at: "2026-09-09T10:00:00Z"
        },
        {
          id: "row-2",
          role: "assistant",
          status: "not a real status",
          content: "",
          created_at: "2026-09-09T10:00:01Z"
        },
        {
          id: "row-3",
          role: "assistant",
          status: "COMPLETED",
          content: "",
          created_at: "2026-09-09T10:00:02Z"
        }
      ]
    });

    expect(parsed.messages.map((row) => row.id)).toEqual(["row-1", "row-3"]);
  });

  it("keeps the response when messages is not a list at all", () => {
    const parsed = GetScriptChatMessagesResponseSchema.parse({
      project_id: "project-1",
      pending: false,
      messages: "gone"
    });

    expect(parsed.project_id).toBe("project-1");
    expect(parsed.messages).toEqual([]);
  });
});

describe("cached script-project media", () => {
  it("accepts the isolated desktop media protocol", () => {
    const parsed = ProjectCutSchema.parse({
      project_id: "project-1",
      shots: [
        {
          timeline_id: "shot-1",
          shot_index: 0,
          sequence_id: 1,
          url: "mago-media://script-project/video-1",
          poster_url: "mago-media://script-project/poster-1"
        }
      ]
    });

    expect(parsed.shots[0]?.url).toBe("mago-media://script-project/video-1");
    expect(parsed.shots[0]?.poster_url).toBe(
      "mago-media://script-project/poster-1"
    );
  });

  it("preserves shot version provenance for comparison and settings reuse", () => {
    const parsed = ProjectCutSchema.parse({
      project_id: "project-1",
      shots: [
        {
          timeline_id: "shot-1",
          shot_index: 0,
          sequence_id: 1,
          url: null,
          poster_url: null,
          versions: [
            {
              layer_id: "layer-1",
              asset_id: "asset-1",
              ready: true,
              status: "available",
              url: "mago-media://script-project/video-1",
              poster_url: "mago-media://script-project/poster-1",
              created_at: "2026-10-02T10:00:00Z",
              input_settings: { duration_s: 6 },
              render_spec: { kind: "shot" },
              fingerprint: "render-fingerprint",
              prompt_rewrite: "raw",
              continues_from: "asset-0"
            }
          ]
        }
      ]
    });

    expect(parsed.shots[0]?.versions[0]).toMatchObject({
      input_settings: { duration_s: 6 },
      render_spec: { kind: "shot" },
      fingerprint: "render-fingerprint",
      prompt_rewrite: "raw",
      continues_from: "asset-0"
    });
  });

  it("accepts structured local sequential-render provenance", () => {
    const continuesFrom = {
      timeline_id: "shot-0",
      asset_id: "asset-0",
      mode: "last_frame",
      reference_asset_id: "reference-0"
    };
    const parsed = ProjectCutSchema.parse({
      project_id: "project-1",
      shots: [
        {
          timeline_id: "shot-1",
          shot_index: 0,
          sequence_id: 1,
          url: "mago-media://script-project/video-1",
          poster_url: null,
          versions: [
            {
              layer_id: "layer-1",
              asset_id: "asset-1",
              ready: true,
              status: "available",
              url: "mago-media://script-project/video-1",
              poster_url: null,
              continues_from: continuesFrom
            }
          ]
        }
      ]
    });

    expect(parsed.shots[0]?.versions[0]?.continues_from).toEqual(continuesFrom);
  });

  it("preserves locks, sheet references, and sheet render provenance", () => {
    const parsed = ProjectStateSchema.parse({
      project_id: "project-1",
      keys: [
        {
          token: "baker",
          name: "Baker",
          layer_id: "layer-1",
          reference_asset_ids: ["reference-1"],
          reference_instruction: "Use the coat",
          images: [
            {
              asset_id: "asset-1",
              clip_id: "clip-1",
              status: "available",
              url: "mago-media://script-project/image-1",
              thumbnail_url: "mago-media://script-project/image-1",
              render_settings: { render_model: "qwen_image_2512_local" },
              fingerprint: "sheet-fingerprint"
            }
          ]
        }
      ],
      shots: [
        {
          timeline_id: "shot-1",
          shot_index: 0,
          sequence_id: 1,
          locked: true
        }
      ]
    });

    expect(parsed.keys[0]).toMatchObject({
      reference_asset_ids: ["reference-1"],
      reference_instruction: "Use the coat",
      images: [
        {
          render_settings: { render_model: "qwen_image_2512_local" },
          fingerprint: "sheet-fingerprint"
        }
      ]
    });
    expect(parsed.shots[0]?.locked).toBe(true);
  });
});

describe("ShotGenerateResultSchema", () => {
  it("reads Shot keys sent as numbers across every answer bucket", () => {
    const parsed = ShotGenerateResultSchema.parse({
      would_run: [8],
      would_run_keys: [8, "9.1"],
      would_run_timeline_ids: ["timeline-8"],
      skipped: [{ sequence_id: 8, key: 8, reason: "unchanged" }],
      blocked: [{ sequence_id: 9, key: 9, missing: [] }]
    });

    expect(parsed.would_run_keys).toEqual(["8", "9.1"]);
    expect(parsed.skipped[0]?.key).toBe("8");
    expect(parsed.blocked[0]?.key).toBe("9");
  });
});
