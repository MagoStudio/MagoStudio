import { afterEach, describe, expect, it, vi } from "vitest";

import { ComfyScriptProjectClient } from "./comfyScriptProjectClient";
import {
  buildDesignVariantEditPrompt,
  ensureDesignMasterKeys,
  LocalScriptProjectService,
  resolveLocalH3Steps,
  resolveLocalH3TextEncoder,
  stripQwenReasoning
} from "./localScriptProjectService";

afterEach(() => vi.restoreAllMocks());

it("refreshes version status from this snapshot's plans without scanning other projects", async () => {
  const plans: Record<string, Record<string, unknown>> = {
    casting: { status: "RUNNING", steps: [] }
  };
  const stored = {
    state: null,
    cut: null,
    planDetails: plans,
    scriptVersions: {
      versions: [{ plan_id: "casting" }, { plan_id: "missing" }]
    }
  };
  const getPlan = vi.fn();
  const service = new LocalScriptProjectService(
    { get: async () => ({ origin: "local" }) } as never,
    { get: async () => structuredClone(stored), getPlan } as never,
    async () => "http://127.0.0.1:8188"
  );
  expect((await service.getSnapshot("p"))?.scriptVersions?.versions).toEqual([
    { plan_id: "casting", status: "RUNNING", summary: null },
    { plan_id: "missing", status: "UNKNOWN", summary: null }
  ]);
  plans.casting = {
    status: "COMPLETED",
    steps: [
      {
        tool_name: "materialise_project_state",
        result: { shots_added: ["shot"] }
      }
    ]
  };
  expect((await service.getSnapshot("p"))?.scriptVersions?.versions).toEqual([
    {
      plan_id: "casting",
      status: "COMPLETED",
      summary: { shots_added: ["shot"] }
    },
    { plan_id: "missing", status: "UNKNOWN", summary: null }
  ]);
  expect(getPlan).not.toHaveBeenCalled();
});

describe("local script-project Qwen output cleanup", () => {
  it("removes thinking and markdown before parsing the final object", () => {
    const answer = [
      "<think>private chain of thought</think>",
      "```json",
      '{"title":"Clean","nested":{"value":"} is safe in a string"}}',
      "```"
    ].join("\n");

    expect(JSON.parse(stripQwenReasoning(answer))).toEqual({
      title: "Clean",
      nested: { value: "} is safe in a string" }
    });
  });

  it("keeps only the balanced JSON object when wrappers leak", () => {
    expect(
      stripQwenReasoning(
        '<|channel>analysis that must go<channel|> FINAL {"ok":true} trailing'
      )
    ).toBe('{"ok":true}');
  });
});

describe("local design versions", () => {
  it("backfills a master slot and gives Qwen Edit identity-safe instructions", () => {
    const variant = {
      token: "mara--winter_coat",
      name: "Mara",
      kind: "character",
      alt: "Winter coat",
      seed_description: "A woman with a sharp bob haircut",
      layer_order: 2
    };
    const ensured = ensureDesignMasterKeys([variant]);

    expect(ensured.addedTokens).toEqual(["mara"]);
    expect(ensured.keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          token: "mara",
          alt: "default",
          is_design_master: true
        }),
        expect.objectContaining({
          token: "mara--winter_coat",
          master_token: "mara"
        })
      ])
    );

    const prompt = buildDesignVariantEditPrompt(
      variant,
      "Replace the jacket with a heavy blue winter coat",
      "Painterly stop motion"
    );
    expect(prompt).toContain('into the "Winter coat" design version');
    expect(prompt).toContain("Preserve the exact same character identity");
    expect(prompt).toContain("Replace the jacket");
  });
});

describe("local sequential shot planning", () => {
  const shot = (index: number) => ({
    timeline_id: `shot-${index}`,
    shot_index: index - 1,
    sequence_id: index,
    key: String(index),
    dropped: false,
    video_prompt: `Shot ${index}.`,
    references: { characters: [{ token: "pilot", asset_id: "sheet-1" }] },
    missing_references: []
  });

  it("blocks a selected continuation whose predecessor has no local render", async () => {
    const projects = {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      })
    };
    const snapshots = {
      get: async () => ({
        state: { shots: [shot(1), shot(2)], keys: [] },
        cut: { shots: [] }
      })
    };
    const service = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );

    const result = await service.generateShots({
      projectId: "project-1",
      isDryRun: true,
      timelineIds: ["shot-2"],
      sequential: { default: { enabled: true, mode: "last_frame" } }
    });

    expect(result.would_run_timeline_ids).toEqual([]);
    expect(result.blocked).toEqual([
      expect.objectContaining({
        timeline_id: "shot-2",
        reason_code: "predecessor_not_rendered"
      })
    ]);
  });

  it("refuses a real run with a shot outside the engine's window", async () => {
    const put = vi.fn();
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "project-1",
          origin: "local",
          type: "script_to_shots"
        })
      } as never,
      {
        get: async () => ({
          state: {
            shots: [{ ...shot(1), duration_s: 20 }, shot(2)],
            keys: []
          },
          cut: { shots: [] }
        }),
        put,
        putPlan: put
      } as never,
      async () => "http://127.0.0.1:8188"
    );

    await expect(
      service.generateShots({
        projectId: "project-1",
        isDryRun: false,
        videoSettings: { frame_range: [0, 144] }
      })
    ).rejects.toThrow(
      "shot 1: minimax_h3_local renders 5-15s; this shot is 20s"
    );
    expect(put).not.toHaveBeenCalled();
  });
});

describe("local casting plan failure state", () => {
  it("fails rather than pauses a plan when Qwen returns malformed output", async () => {
    const runCasting = vi
      .spyOn(ComfyScriptProjectClient.prototype, "runCasting")
      .mockResolvedValue('{"title":"cut off"');
    let storedPlan: Record<string, unknown> | null = null;
    const projects = {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      })
    };
    const snapshots = {
      get: async () => ({ scriptVersions: { versions: [] } }),
      put: async () => {},
      getPlan: async () => storedPlan,
      putPlan: async (
        _projectId: string,
        _planId: string,
        plan: Record<string, unknown>
      ) => {
        storedPlan = structuredClone(plan);
      }
    };
    const service = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );

    await service.cast({
      projectId: "project-1",
      script: "INT. ROOM - DAY\nA person enters.",
      maxShots: 10,
      isAtomicShotsRequested: false
    });

    await vi.waitFor(() => {
      expect(storedPlan).toMatchObject({
        status: "FAILED",
        error: { message: "Invalid response from model" }
      });
    });
    // The answer is asked for once more with the reason before the run fails.
    expect(runCasting).toHaveBeenCalledTimes(2);
    expect(runCasting.mock.calls[0]![0]).toContain("SEPARATE STYLE");
    expect(runCasting.mock.calls[1]![0]).toContain("RETRY REQUIREMENT");
  });
});

describe("local cut export planning", () => {
  it("reports a complete pinned cut without starting FFmpeg during dry-run", async () => {
    const projects = {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      }),
      resolveMediaPath: async () => null
    };
    const snapshots = {
      get: async () => ({
        state: {
          shots: [
            { timeline_id: "shot-1", shot_index: 0, sequence_id: 1 },
            { timeline_id: "shot-2", shot_index: 1, sequence_id: 2 },
            {
              timeline_id: "shot-3",
              shot_index: 2,
              sequence_id: 3,
              hidden: true
            }
          ],
          keys: []
        },
        cut: {
          shots: [
            { timeline_id: "shot-1", asset_id: "video-1" },
            { timeline_id: "shot-2", asset_id: "video-2" },
            { timeline_id: "shot-3", asset_id: null }
          ]
        }
      }),
      resolveMediaPath: async (assetId: string) => `C:/renders/${assetId}.mp4`
    };
    const service = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );

    await expect(
      service.exportCut({ projectId: "project-1", isDryRun: true })
    ).resolves.toMatchObject({
      would_export: [1, 2],
      refused: [],
      plan_id: null
    });
  });
});

describe("local MiniMax H3 prompt composition", () => {
  it("defaults invalid or missing local H3 presets to the four-step baseline", () => {
    expect(resolveLocalH3Steps(undefined)).toBe(4);
    expect(resolveLocalH3Steps(5)).toBe(4);
    expect(resolveLocalH3Steps(3)).toBe(3);
    expect(resolveLocalH3Steps(8)).toBe(8);
  });

  it("defaults invalid or missing H3 text encoders to the current model", () => {
    expect(resolveLocalH3TextEncoder(undefined)).toBe("vanilla");
    expect(resolveLocalH3TextEncoder("unknown")).toBe("vanilla");
    expect(resolveLocalH3TextEncoder("heretic")).toBe("heretic");
    expect(resolveLocalH3TextEncoder("vanilla")).toBe("vanilla");
  });
});

describe("local script-sheet image descriptions", () => {
  it("stores a VLM caption on the image version and follows the selected version", async () => {
    let state: Record<string, unknown> = {
      keys: [
        {
          token: "pilot",
          name: "Pilot",
          kind: "character",
          description: "casting seed",
          seed_description: "casting seed",
          enabled: true,
          effective_asset_id: "image-1",
          effective_source: "render",
          images: [
            {
              asset_id: "image-1",
              source: "render",
              description: "casting seed",
              has_description: true
            },
            {
              asset_id: "image-2",
              source: "upload",
              description: "second version caption",
              has_description: true,
              description_source: "vlm"
            }
          ]
        }
      ],
      shots: []
    };
    const projects = {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      }),
      resolveMediaPath: async () => null
    };
    const snapshots = {
      get: async () => ({ state }),
      resolveMediaPath: async (assetId: string) => `C:/renders/${assetId}.png`,
      put: async (input: { state?: Record<string, unknown> }) => {
        if (input.state) state = input.state;
      }
    };
    const describeImage = vi.fn(async () => "actual visible pilot caption");
    const service = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188",
      async () => "qwen38-27b-q5",
      describeImage
    );

    await service.update({
      projectId: "project-1",
      operation: "describe-sheet",
      payload: { token: "pilot", assetId: "image-1" }
    });

    expect(describeImage).toHaveBeenCalledWith(
      "C:/renders/image-1.png",
      "character"
    );
    expect((state.keys as Array<Record<string, unknown>>)[0]).toMatchObject({
      description: "actual visible pilot caption",
      images: expect.arrayContaining([
        expect.objectContaining({
          asset_id: "image-1",
          description: "actual visible pilot caption",
          has_description: true,
          description_source: "vlm"
        })
      ])
    });

    await service.update({
      projectId: "project-1",
      operation: "pin-sheet",
      payload: { token: "pilot", selectedAssetId: "image-2" }
    });

    expect(state).toMatchObject({
      keys: [
        {
          description: "second version caption",
          effective_asset_id: "image-2",
          effective_source: "upload"
        }
      ]
    });
  });
});

describe("local project visual style", () => {
  it.each(["", null])(
    "migrates an explicitly cleared legacy style (%s)",
    async (legacyStyle) => {
      const settings: Record<string, unknown> = {};
      const state = { visual_style: legacyStyle, keys: [], shots: [] };
      const setSettingIfAbsent = vi.fn(
        async (_id: string, key: string, value: unknown) => {
          settings[key] = value;
          return true;
        }
      );
      const service = new LocalScriptProjectService(
        {
          get: async () => ({ origin: "local", settings }),
          setSettingIfAbsent
        } as never,
        { get: async () => ({ state }) } as never,
        async () => "http://127.0.0.1:8188"
      );
      await service.getSnapshot("p");
      await service.getSnapshot("p");
      expect(settings).toEqual({ visual_style: legacyStyle });
      expect(setSettingIfAbsent).toHaveBeenCalledOnce();
    }
  );
  it.each([undefined, "User ink", "", null])(
    "migrates the legacy style once and preserves settings (%s)",
    async (saved) => {
      const settings: Record<string, unknown> =
        saved === undefined ? {} : { visual_style: saved };
      const state = { visual_style: "Legacy ink", keys: [], shots: [] };
      const setSettingIfAbsent = vi.fn(
        async (_id: string, key: string, value: unknown) => {
          if (key in settings) return false;
          settings[key] = value;
          return true;
        }
      );
      const service = new LocalScriptProjectService(
        {
          get: async () => ({ origin: "local", settings }),
          setSettingIfAbsent
        } as never,
        { get: async () => ({ state }) } as never,
        async () => "http://127.0.0.1:8188"
      );
      const expected = saved === undefined ? "Legacy ink" : (saved ?? "");
      expect((await service.getSnapshot("p"))?.state?.visual_style).toBe(
        expected
      );
      expect((await service.getSnapshot("p"))?.state?.visual_style).toBe(
        expected
      );
      expect(setSettingIfAbsent).toHaveBeenCalledTimes(
        saved === undefined ? 1 : 0
      );
      expect(state.visual_style).toBe("Legacy ink");
    }
  );
});

describe("local shot camera prompt", () => {
  it("persists camera edits and returns the updated shot", async () => {
    let state: Record<string, unknown> = {
      keys: [],
      shots: [
        {
          timeline_id: "shot-1",
          camera: { framing: "wide", movement: "static", lens: "24mm" },
          tags: { characters: [], environments: [], props: [] }
        }
      ]
    };
    const projects = {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      }),
      resolveMediaPath: async () => null
    };
    const snapshots = {
      get: async () => ({ state }),
      put: async (input: { state?: Record<string, unknown> }) => {
        if (input.state) state = input.state;
      }
    };
    const service = new LocalScriptProjectService(
      projects as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );

    await expect(
      service.update({
        projectId: "project-1",
        operation: "edit-shot",
        payload: {
          timelineId: "shot-1",
          camera: { framing: "close-up", movement: null, lens: "85mm" }
        }
      })
    ).resolves.toMatchObject({
      timeline_id: "shot-1",
      camera: { framing: "close-up", movement: null, lens: "85mm" }
    });
    const shot = (state.shots as Array<Record<string, unknown>>)[0]!;
    expect(shot).toMatchObject({
      camera: { framing: "close-up", movement: null, lens: "85mm" }
    });
    // Camera is local-only and no cast writes it, so it is not a cast-owned
    // edit a re-cast has to preserve.
    expect(shot.edited_fields).toBeUndefined();
  });
});

describe("local casting through the backend pipeline", () => {
  it.each([undefined, false, true])(
    "materialises cloud casting locally with separate style %s",
    async (separateStyle) => {
      const casting = {
        title: "Cloud story",
        visual_style: "Cloud ink",
        sequences: [],
        characters: [],
        environments: [],
        props: []
      };
      const cloud = vi
        .fn()
        .mockResolvedValue({ casting, model: "gemini-2.5-pro" });
      const comfy = vi
        .fn()
        .mockRejectedValue(new Error("Comfy is not configured"));
      const qwen = vi.spyOn(ComfyScriptProjectClient.prototype, "runCasting");
      let snapshot: Record<string, unknown> | null = null;
      const plans = new Map<string, Record<string, unknown>>();
      const projectSettings: Record<string, unknown> = {};
      const service = new LocalScriptProjectService(
        {
          get: async () => ({
            id: "p",
            origin: "local",
            type: "script_to_shots",
            settings: projectSettings
          }),
          renameUntitledFromCasting: async () => {},
          setSettingIfAbsent: async (
            _id: string,
            key: string,
            value: unknown
          ) => {
            if (key in projectSettings) return false;
            projectSettings[key] = value;
            return true;
          }
        } as never,
        {
          get: async () => snapshot,
          put: async (value: Record<string, unknown>) => {
            snapshot = { ...(snapshot ?? {}), ...value };
          },
          getPlan: async (id: string) => plans.get(id) ?? null,
          putPlan: async (
            _project: string,
            id: string,
            plan: Record<string, unknown>
          ) => {
            plans.set(id, structuredClone(plan));
          }
        } as never,
        comfy,
        undefined,
        undefined,
        cloud
      );
      const { plan_id } = await service.cast({
        projectId: "p",
        script: "A cloud story",
        maxShots: 12,
        isSeparateStyleRequested: separateStyle
      });
      await vi.waitFor(() =>
        expect(plans.get(plan_id)?.status).toBe("COMPLETED")
      );
      expect(cloud).toHaveBeenCalledExactlyOnceWith(
        "casting",
        {
          script: "A cloud story",
          shot_limit: 12,
          atomic_shots: true,
          sequence_mode: true,
          include_dialogue: true,
          split_alts: false,
          separate_style: separateStyle ?? true,
          separate_camera: false
        },
        expect.any(Function)
      );
      expect(projectSettings.visual_style).toBe("Cloud ink");
      expect(comfy).not.toHaveBeenCalled();
      expect(qwen).not.toHaveBeenCalled();
      const steps = plans.get(plan_id)!.steps as Array<Record<string, unknown>>;
      expect(steps[1]!.result).toEqual(
        expect.objectContaining({
          casting,
          model: "gemini-2.5-pro",
          text_model_route: "cloud"
        })
      );
      expect(snapshot!.state).toBeTruthy();
    }
  );

  it("validates its options the way the cloud's _cast_options does", async () => {
    const service = new LocalScriptProjectService(
      {
        get: async () => ({ id: "p", origin: "local", type: "script_to_shots" })
      } as never,
      { get: async () => null } as never,
      async () => "http://127.0.0.1:8188"
    );
    await expect(
      service.cast({
        projectId: "p",
        script: "INT. ROOM - DAY",
        isAtomicShotsRequested: false,
        isRenderSequencesRequested: true
      })
    ).rejects.toThrow(
      "render_sequences cannot be used with atomic_shots=false"
    );
    await expect(
      service.cast({ projectId: "p", script: "x", engine: "seedance_2" })
    ).rejects.toThrow("engine must be one of: v9.1.0, minimax_h3_max");
    await expect(
      service.cast({ projectId: "p", script: "x", maxShots: 0 })
    ).rejects.toThrow("max_shots must be between 1 and 200");
  });

  it("casts, runs the atomic pass and materialises packed shots", async () => {
    const answers = [
      {
        title: "The Vault",
        sequences: [],
        sequence_video_prompts: [
          {
            id: 1,
            video_prompt: "Amara cracks the safe.",
            needs_previous_frame: false,
            dialogue: [
              { speaker: "AMARA", line: "Almost there.", language: "English" }
            ]
          }
        ],
        characters: [
          {
            name: "Amara",
            description: "A safecracker.",
            sequence_ids: [1],
            alt: "default",
            t2i_prompt: "Amara turnaround."
          }
        ],
        environments: [
          {
            name: "Vault",
            description: "A steel vault.",
            sequence_ids: [1],
            alt: "default",
            t2i_prompt: "Vault plate."
          }
        ],
        props: []
      },
      {
        sequence_shots: [
          {
            sequence_id: 1,
            shots: [
              {
                action: "Amara kneels at the safe",
                video_prompt: "Amara kneels.",
                characters: ["amara"],
                environments: ["vault"],
                props: [],
                needs_previous_frame: false,
                beat_type: "physical_beat",
                duration_short_s: 2.5,
                duration_long_s: 4,
                camera: { framing: "wide", movement: "", lens: "" }
              },
              {
                action: "She whispers",
                video_prompt: "Close on Amara.",
                characters: ["amara"],
                environments: ["vault"],
                props: [],
                needs_previous_frame: true,
                dialogue: [
                  {
                    speaker: "AMARA",
                    line: "Almost there.",
                    language: "English"
                  }
                ],
                beat_type: "contained_reaction",
                duration_short_s: 2,
                duration_long_s: 3.25,
                camera: { framing: "close-up", movement: "", lens: "" }
              }
            ]
          }
        ]
      }
    ];
    const runCasting = vi
      .spyOn(ComfyScriptProjectClient.prototype, "runCasting")
      .mockImplementation(async () => JSON.stringify(answers.shift()));
    let snapshot: Record<string, unknown> | null = null;
    const plans = new Map<string, Record<string, unknown>>();
    const renamed: string[] = [];
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "p",
          origin: "local",
          type: "script_to_shots"
        }),
        renameUntitledFromCasting: async (_id: string, title: string) => {
          renamed.push(title);
        }
      } as never,
      {
        get: async () =>
          snapshot && { ...snapshot, planDetails: Object.fromEntries(plans) },
        put: async (value: Record<string, unknown>) => {
          snapshot = { ...(snapshot ?? {}), ...value };
        },
        getPlan: async (id: string) => plans.get(id) ?? null,
        putPlan: async (
          _project: string,
          id: string,
          plan: Record<string, unknown>
        ) => {
          plans.set(id, structuredClone(plan));
        }
      } as never,
      async () => "http://127.0.0.1:8188"
    );

    const { plan_id: planId, version } = await service.cast({
      projectId: "p",
      script:
        "INT. VAULT - NIGHT\n\nAmara kneels at the safe.\n\nAMARA\nAlmost there.",
      maxShots: 30,
      isAtomicShotsRequested: true
    });
    await vi.waitFor(() => expect(plans.get(planId)?.status).toBe("COMPLETED"));

    expect(version).toBe(1);
    expect(runCasting).toHaveBeenCalledTimes(2);
    expect(runCasting.mock.calls[1]![0]).toContain(
      "You are breaking already-identified sequences down into shots"
    );
    expect(runCasting.mock.calls[1]![0]).not.toContain("SEQUENCE MODE");
    expect(renamed).toEqual(["The Vault"]);
    const state = snapshot!.state as Record<string, unknown>;
    const shots = state.shots as Array<Record<string, unknown>>;
    expect(shots).toHaveLength(1);
    expect(shots[0]).toEqual(
      expect.objectContaining({
        key: "rseq_1_1",
        dropped: false,
        tags: { characters: ["amara"], environments: ["vault"], props: [] },
        missing_references: [
          { token: "amara", reason: "no image" },
          { token: "vault", reason: "no image" }
        ]
      })
    );
    expect(shots[0]!.video_prompt).toContain("[Shot 2]");
    expect(
      (state.keys as Array<Record<string, unknown>>).map((key) => key.token)
    ).toEqual(["amara", "vault"]);
    // Read back the way the renderer reads it: the status and summary come
    // from the version's plan, as GET /projects/:id/script reports them.
    const read = await service.getSnapshot("p");
    const versions = (read!.scriptVersions as Record<string, unknown>)
      .versions as Array<Record<string, unknown>>;
    expect(
      (read!.scriptVersions as Record<string, unknown>).active_version
    ).toBe(1);
    expect(versions).toEqual([
      expect.objectContaining({
        version: 1,
        plan_id: planId,
        render_sequences: true,
        status: "COMPLETED",
        summary: expect.objectContaining({ shots_added: ["rseq_1_1"] })
      })
    ]);
    const steps = plans.get(planId)!.steps as Array<Record<string, unknown>>;
    expect(steps.map((step) => step.tool_name)).toEqual([
      "submit_script_casting",
      "poll_script_casting",
      "materialise_project_state"
    ]);
    expect(steps[0]!.tool_args).toEqual(
      expect.objectContaining({
        atomic_shots: true,
        sequence_mode: true,
        include_dialogue: true
      })
    );
  });
});

describe("local script-project media lookup", () => {
  const image = {
    asset_id: "asset-1",
    clip_id: "clip-1",
    description: null,
    has_description: false
  };
  const snapshotsFor = (put = vi.fn()) => {
    const byProject = new Map<string, Record<string, unknown>>([
      [
        "cloud-mirror",
        { state: { keys: [{ token: "mara", images: [image] }] }, cut: null }
      ],
      [
        "project-1",
        {
          state: { keys: [{ token: "mara", images: [image] }] },
          cut: { shots: [{ versions: [{ asset_id: "video-1" }] }] }
        }
      ]
    ]);
    return {
      listProjectIds: async () => [...byProject.keys()],
      get: async (projectId: string) => byProject.get(projectId) ?? null,
      put
    };
  };
  const projects = {
    get: async (projectId: string) => ({
      id: projectId,
      origin: projectId === "cloud-mirror" ? "cloud" : "local",
      type: "script_to_shots"
    })
  };

  it("finds a sheet image or shot version in a local project, never a cloud mirror", async () => {
    const service = new LocalScriptProjectService(
      projects as never,
      snapshotsFor() as never,
      async () => "http://127.0.0.1:8188"
    );
    await expect(service.findMedia({ clipId: "clip-1" })).resolves.toEqual({
      projectId: "project-1",
      kind: "sheet-image",
      image
    });
    await expect(service.findMedia({ assetId: "video-1" })).resolves.toEqual({
      projectId: "project-1",
      kind: "shot-version",
      image: null
    });
    await expect(
      service.findMedia({ assetId: "elsewhere" })
    ).resolves.toBeNull();
  });

  it("stores a version's own description, a blank one included", async () => {
    const put = vi.fn();
    const service = new LocalScriptProjectService(
      projects as never,
      snapshotsFor(put) as never,
      async () => "http://127.0.0.1:8188"
    );
    await service.update({
      projectId: "project-1",
      operation: "edit-image-description",
      payload: { assetId: "asset-1", description: "" }
    });
    const state = put.mock.calls[0]![0].state as {
      keys: Array<{ images: Array<Record<string, unknown>> }>;
    };
    expect(state.keys[0]!.images[0]).toEqual(
      expect.objectContaining({
        description: "",
        has_description: true,
        description_source: "user"
      })
    );
  });
});

describe("local sheet runs", () => {
  it("saves requested references on the key even when it does not render", async () => {
    const state = {
      keys: [{ token: "mara", name: "Mara", enabled: false, images: [] }],
      shots: []
    };
    const put = vi.fn();
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "project-1",
          origin: "local",
          type: "script_to_shots"
        }),
        resolveMediaPath: async () => "C:/library/ref.png"
      } as never,
      {
        get: async () => ({ state, cut: null, planDetails: {} }),
        put,
        resolveMediaPath: async () => null
      } as never,
      async () => "http://127.0.0.1:8188"
    );

    const result = await service.generateSheets({
      projectId: "project-1",
      isDryRun: false,
      tokens: ["mara"],
      referenceAssetIds: ["ref-1"],
      referenceInstruction: "Use the coat"
    });

    expect(result).toEqual(
      expect.objectContaining({
        would_run: [],
        skipped: [{ token: "mara", reason: "disabled" }],
        plan_id: null
      })
    );
    const saved = put.mock.calls.at(-1)![0].state.keys[0];
    expect(saved).toEqual(
      expect.objectContaining({
        reference_asset_ids: ["ref-1"],
        reference_instruction: "Use the coat"
      })
    );
  });
});

const createInMemoryScriptProjectStore = (
  initialState: Record<string, unknown>
) => {
  const stored: {
    state: Record<string, unknown>;
    cut: Record<string, unknown>;
  } = { state: initialState, cut: { shots: [] } };
  const plans = new Map<string, Record<string, unknown>>();
  const snapshots = {
    get: async () => ({
      state: stored.state,
      cut: stored.cut,
      planDetails: Object.fromEntries(plans)
    }),
    put: async (input: { state?: Record<string, unknown> }) => {
      if (input.state) stored.state = input.state;
    },
    getPlan: async (id: string) => plans.get(id) ?? null,
    putPlan: async (
      _projectId: string,
      id: string,
      plan: Record<string, unknown>
    ) => {
      plans.set(id, plan);
    }
  };
  const service = new LocalScriptProjectService(
    {
      get: async () => ({
        id: "project-1",
        origin: "local",
        type: "script_to_shots"
      })
    } as never,
    snapshots as never,
    async () => "http://127.0.0.1:8188"
  );
  return { service, stored, plans };
};

const waitForProjectRunToSettle = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const stepStatusesFor = (
  plan: Record<string, unknown> | undefined,
  isStepForItem: (step: Record<string, unknown>) => boolean
) =>
  ((plan?.steps ?? []) as Array<Record<string, unknown>>)
    .filter(isStepForItem)
    .map((step) => step.status);

describe("local sheet group creation", () => {
  it("creates the entity added from the Assets tab and renders it", async () => {
    const { service, stored, plans } = createInMemoryScriptProjectStore({
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    });

    const result = await service.generateSheets({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [1024, 1024],
      settings: {
        prompt: "A baker in flour-dusted overalls",
        render_model: "seedream_5_pro_t2i"
      },
      tokens: ["baker"],
      sheetGroupToCreate: { name: "The Baker", kind: "character" }
    });

    expect(result).toEqual(
      expect.objectContaining({
        would_run: ["baker"],
        plan_id: expect.any(String)
      })
    );
    expect(
      (stored.state.keys as Array<Record<string, unknown>>).find(
        (key) => key.token === "baker"
      )
    ).toEqual(
      expect.objectContaining({
        name: "The Baker",
        kind: "character",
        prompt: "A baker in flour-dusted overalls",
        enabled: true
      })
    );
    expect(plans.get(String(result.plan_id))?.local_targets).toEqual([
      expect.objectContaining({ token: "baker" })
    ]);
  });

  it("does not save the entity when the render cannot start", async () => {
    const { service, stored } = createInMemoryScriptProjectStore({
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    });
    await service.generateSheets({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [1024, 1024],
      settings: { render_model: "seedream_5_pro_t2i" }
    });

    await expect(
      service.generateSheets({
        projectId: "project-1",
        isDryRun: false,
        outputSize: [1024, 1024],
        settings: { prompt: "A baker", render_model: "seedream_5_pro_t2i" },
        tokens: ["baker"],
        sheetGroupToCreate: { name: "The Baker", kind: "character" }
      })
    ).rejects.toThrow("already has a job running");
    expect(
      (stored.state.keys as Array<Record<string, unknown>>).some(
        (key) => key.token === "baker"
      )
    ).toBe(false);
  });

  it("does not save the entity on a dry run", async () => {
    const { service, stored } = createInMemoryScriptProjectStore({
      keys: [],
      shots: []
    });

    const result = await service.generateSheets({
      projectId: "project-1",
      isDryRun: true,
      settings: { prompt: "A baker", render_model: "seedream_5_pro_t2i" },
      tokens: ["baker"],
      sheetGroupToCreate: { name: "The Baker", kind: "character" }
    });

    expect(result.would_run).toEqual(["baker"]);
    expect(stored.state.keys).toEqual([]);
  });
});

describe("local paused plans", () => {
  const isStepForToken = (token: string) => (step: Record<string, unknown>) =>
    (step.tool_args as { token?: string } | undefined)?.token === token;

  const cloudSheetRequest = {
    projectId: "project-1",
    isDryRun: false,
    outputSize: [1024, 1024] as [number, number],
    settings: { render_model: "seedream_5_pro_t2i" }
  };

  const pauseCloudSheetPlan = async (
    service: LocalScriptProjectService,
    planId: string
  ) => {
    await service.update({
      projectId: "project-1",
      operation: "fail-cloud-sheet-render",
      payload: { planId, token: "mara", message: "Offline" }
    });
    await waitForProjectRunToSettle();
  };

  it("lets a paused sheet plan's keys render again and stops it rendering them later", async () => {
    const { service, plans } = createInMemoryScriptProjectStore({
      keys: [
        { token: "harbour", name: "Harbour", prompt: "Harbour", images: [] },
        { token: "mara", name: "Mara", prompt: "Mara", images: [] }
      ],
      shots: []
    });
    const pausedPlanId = String(
      (await service.generateSheets(cloudSheetRequest)).plan_id
    );
    await pauseCloudSheetPlan(service, pausedPlanId);
    expect(plans.get(pausedPlanId)?.status).toBe("PAUSED");

    const rerun = await service.generateSheets({
      ...cloudSheetRequest,
      tokens: ["mara"]
    });

    expect(rerun.would_run).toEqual(["mara"]);
    const pausedPlan = plans.get(pausedPlanId);
    expect(pausedPlan?.status).toBe("PAUSED");
    expect(stepStatusesFor(pausedPlan, isStepForToken("mara"))).toEqual([
      "SKIPPED",
      "SKIPPED"
    ]);
    expect(stepStatusesFor(pausedPlan, isStepForToken("harbour"))).toEqual([
      "PENDING",
      "PENDING"
    ]);
  });

  it("keeps a fully taken-over paused sheet plan paused, with every step skipped", async () => {
    const { service, plans } = createInMemoryScriptProjectStore({
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    });
    const pausedPlanId = String(
      (await service.generateSheets(cloudSheetRequest)).plan_id
    );
    await pauseCloudSheetPlan(service, pausedPlanId);

    await service.generateSheets(cloudSheetRequest);

    const pausedPlan = plans.get(pausedPlanId);
    expect(pausedPlan?.status).toBe("PAUSED");
    expect(
      new Set(stepStatusesFor(pausedPlan, isStepForToken("mara")))
    ).toEqual(new Set(["SKIPPED"]));
  });

  it("lets a paused shot plan's shots render again and skips them in the paused plan", async () => {
    vi.spyOn(
      LocalScriptProjectService.prototype as unknown as {
        renderShots: () => Promise<void>;
      },
      "renderShots"
    ).mockResolvedValue(undefined);
    const shot = (index: number) => ({
      timeline_id: `shot-${index}`,
      shot_index: index - 1,
      sequence_id: index,
      key: String(index),
      dropped: false,
      video_prompt: `Shot ${index}.`,
      duration_s: 6,
      references: { characters: [{ token: "pilot", asset_id: "sheet-1" }] },
      missing_references: []
    });
    const { service, plans } = createInMemoryScriptProjectStore({
      shots: [shot(1), shot(2)],
      keys: []
    });
    const pausedPlanId = String(
      (await service.generateShots({ projectId: "project-1", isDryRun: false }))
        .plan_id
    );
    await waitForProjectRunToSettle();
    plans.set(pausedPlanId, { ...plans.get(pausedPlanId), status: "PAUSED" });

    const rerun = await service.generateShots({
      projectId: "project-1",
      isDryRun: false,
      timelineIds: ["shot-1"]
    });

    expect(rerun.would_run_timeline_ids).toEqual(["shot-1"]);
    const pausedPlan = plans.get(pausedPlanId);
    expect(pausedPlan?.status).toBe("PAUSED");
    expect(
      new Set(
        stepStatusesFor(pausedPlan, (step) => step.timeline_id === "shot-1")
      )
    ).toEqual(new Set(["SKIPPED"]));
    expect(
      new Set(
        stepStatusesFor(pausedPlan, (step) => step.timeline_id === "shot-2")
      )
    ).toEqual(new Set(["PENDING"]));
  });
  it("also skips a paused plan's shot that continues from a taken-over shot", async () => {
    vi.spyOn(
      LocalScriptProjectService.prototype as unknown as {
        renderShots: () => Promise<void>;
      },
      "renderShots"
    ).mockResolvedValue(undefined);
    const shot = (index: number) => ({
      timeline_id: `shot-${index}`,
      shot_index: index - 1,
      sequence_id: index,
      key: String(index),
      dropped: false,
      video_prompt: `Shot ${index}.`,
      duration_s: 6,
      references: { characters: [{ token: "pilot", asset_id: "sheet-1" }] },
      missing_references: []
    });
    const { service, plans } = createInMemoryScriptProjectStore({
      shots: [shot(1), shot(2)],
      keys: []
    });
    const pausedPlanId = String(
      (await service.generateShots({ projectId: "project-1", isDryRun: false }))
        .plan_id
    );
    await waitForProjectRunToSettle();
    const pausedPlan = plans.get(pausedPlanId)!;
    plans.set(pausedPlanId, {
      ...pausedPlan,
      status: "PAUSED",
      steps: [
        ...(pausedPlan.steps as Array<Record<string, unknown>>),
        {
          tool_name: "poll_prev_shot_complete",
          timeline_id: "shot-2",
          status: "PENDING",
          tool_args: { prev_timeline_id: "shot-1" }
        }
      ]
    });

    await service.generateShots({
      projectId: "project-1",
      isDryRun: false,
      timelineIds: ["shot-1"]
    });

    expect(
      new Set(
        stepStatusesFor(
          plans.get(pausedPlanId),
          (step) => step.timeline_id === "shot-2"
        )
      )
    ).toEqual(new Set(["SKIPPED"]));
  });
});

describe("local cloud sheet plans", () => {
  it("waits for the renderer, keeps its image as a local version, then frees the project", async () => {
    let state: Record<string, unknown> = {
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    };
    const plans = new Map<string, Record<string, unknown>>();
    const snapshots = {
      get: async () => ({
        state,
        cut: null,
        planDetails: Object.fromEntries(plans)
      }),
      put: async (input: { state?: Record<string, unknown> }) => {
        if (input.state) state = input.state;
      },
      getPlan: async (id: string) => plans.get(id) ?? null,
      putPlan: async (
        _projectId: string,
        id: string,
        plan: Record<string, unknown>
      ) => {
        plans.set(id, plan);
      },
      storeRemoteMedia: async () => ({
        id: "media-1",
        url: "mago-media://script-project/media-1",
        isImage: true
      })
    };
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "project-1",
          origin: "local",
          type: "script_to_shots"
        })
      } as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );

    const started = await service.generateSheets({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [1024, 1024],
      settings: { render_model: "seedream_5_pro_t2i" }
    });
    const planId = String(started.plan_id);
    expect(plans.get(planId)).toEqual(
      expect.objectContaining({ local_executor: "mago-cloud-renderer" })
    );
    // Busy until the renderer reports back.
    await expect(
      service.generateSheets({
        projectId: "project-1",
        isDryRun: false,
        settings: { render_model: "seedream_5_pro_t2i" },
        tokens: ["mara"],
        referenceAssetIds: []
      })
    ).rejects.toThrow("already has a job running");

    await service.update({
      projectId: "project-1",
      operation: "start-cloud-sheet-render",
      payload: { planId, token: "mara", cloudClipId: "c1", cloudAssetId: "a1" }
    });
    await service.update({
      projectId: "project-1",
      operation: "add-cloud-sheet-render",
      payload: {
        planId,
        token: "mara",
        prompt: "Mara",
        outputUrl: "https://cdn.example/mara.png",
        cloudAssetId: "a1"
      }
    });

    expect(plans.get(planId)?.status).toBe("COMPLETED");
    const [key] = state.keys as Array<Record<string, unknown>>;
    expect(key).toEqual(
      expect.objectContaining({
        effective_asset_id: "media-1",
        last_spec: expect.objectContaining({
          render_model: "seedream_5_pro_t2i"
        })
      })
    );
    expect((key!.images as Array<Record<string, unknown>>)[0]).toEqual(
      expect.objectContaining({
        asset_id: "media-1",
        fingerprint: expect.stringMatching(/^sha256:/)
      })
    );
    // Same inputs again: nothing to render, and the project is free.
    await Promise.resolve();
    await expect(
      service.generateSheets({
        projectId: "project-1",
        isDryRun: false,
        outputSize: [1024, 1024],
        settings: { render_model: "seedream_5_pro_t2i" }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        would_run: [],
        skipped: [
          { token: "mara", reason: "already rendered with these inputs" }
        ]
      })
    );
  });
});

describe("mirrored cloud plans", () => {
  const mirroredCloudPlan = {
    id: "cloud-plan-1",
    status: "RUNNING",
    input_data: { project_id: "cloud-project-1" },
    steps: []
  };

  const createServiceWithMirroredCloudPlan = () => {
    const putPlan = vi.fn();
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "cloud-project-1",
          origin: "cloud",
          type: "script_to_shots"
        })
      } as never,
      {
        getPlan: async () => mirroredCloudPlan,
        putPlan
      } as never,
      async () => "http://127.0.0.1:8188"
    );
    return { service, putPlan };
  };

  it("refuses to cancel a cloud plan locally", async () => {
    const { service, putPlan } = createServiceWithMirroredCloudPlan();

    await expect(service.cancelPlan("cloud-plan-1")).rejects.toThrow(
      "This plan runs on Mago Cloud"
    );
    expect(putPlan).not.toHaveBeenCalled();
  });

  it("refuses to resume a cloud plan locally", async () => {
    const { service, putPlan } = createServiceWithMirroredCloudPlan();

    await expect(service.resumePlan("cloud-plan-1")).rejects.toThrow(
      "This plan runs on Mago Cloud"
    );
    expect(putPlan).not.toHaveBeenCalled();
  });
});

describe("local scene list editing", () => {
  const castShot = (
    index: number,
    overrides: Record<string, unknown> = {}
  ) => ({
    timeline_id: `shot-${index}`,
    shot_index: index - 1,
    sequence_id: index,
    key: String(index),
    heading: `${index} Kitchen`,
    video_prompt: `Shot ${index}.`,
    tags: { characters: [], environments: [], props: [] },
    ...overrides
  });

  const createSceneListService = (shots: Record<string, unknown>[]) => {
    const stored: {
      state: Record<string, unknown>;
      cut: Record<string, unknown>;
      scriptVersions: Record<string, unknown>;
    } = {
      state: { keys: [], shots },
      cut: {
        shots: shots.map((shot) => ({
          timeline_id: shot.timeline_id,
          asset_id: null,
          versions: []
        })),
        export: null
      },
      scriptVersions: { active_version: 1, versions: [] }
    };
    const snapshots = {
      get: async () => structuredClone(stored),
      put: async (input: {
        state?: Record<string, unknown>;
        cut?: Record<string, unknown>;
      }) => {
        if (input.state) stored.state = input.state;
        if (input.cut) stored.cut = input.cut;
      }
    };
    const service = new LocalScriptProjectService(
      {
        get: async () => ({
          id: "project-1",
          origin: "local",
          type: "script_to_shots"
        })
      } as never,
      snapshots as never,
      async () => "http://127.0.0.1:8188"
    );
    return { service, stored };
  };

  const storedShots = (stored: { state: Record<string, unknown> }) =>
    stored.state.shots as Array<Record<string, unknown>>;

  it("adds a shot at a position and lists it in the cut", async () => {
    const { service, stored } = createSceneListService([
      castShot(1),
      castShot(2)
    ]);

    const added = await service.update({
      projectId: "project-1",
      operation: "add-shot",
      payload: {
        shot_index: 1,
        heading: "Pantry",
        video_prompt: "Leo opens the pantry.",
        dialogue: [],
        tags: { characters: [], environments: [], props: [] }
      }
    });

    expect(added).toMatchObject({
      manual: true,
      sequence_id: null,
      heading: "Pantry",
      shot_index: 1
    });
    expect(storedShots(stored).map((shot) => shot.timeline_id)).toEqual([
      "shot-1",
      added.timeline_id,
      "shot-2"
    ]);
    const view = await service.getSnapshot("project-1");
    expect(
      (view!.cut!.shots as Array<Record<string, unknown>>).map(
        (shot) => shot.timeline_id
      )
    ).toEqual(["shot-1", added.timeline_id, "shot-2"]);
    expect(view?.cut?.missing_timeline_ids).toContain(added.timeline_id);
  });

  it("refuses to add a shot before the project is cast", async () => {
    const { service } = createSceneListService([]);
    await expect(
      service.update({
        projectId: "project-1",
        operation: "add-shot",
        payload: { shot_index: null, video_prompt: "x", dialogue: [], tags: {} }
      })
    ).rejects.toThrow("Cast a script into this project before adding shots");
  });

  it("moves, hides and renames a shot without marking it edited", async () => {
    const { service, stored } = createSceneListService([
      castShot(1),
      castShot(2),
      castShot(3)
    ]);

    const moved = await service.update({
      projectId: "project-1",
      operation: "edit-shot",
      payload: { timelineId: "shot-3", shot_index: 0 }
    });
    expect(moved.shots).toEqual([
      { timeline_id: "shot-3", shot_index: 0, edited: false },
      { timeline_id: "shot-1", shot_index: 1, edited: false },
      { timeline_id: "shot-2", shot_index: 2, edited: false }
    ]);

    await service.update({
      projectId: "project-1",
      operation: "edit-shot",
      payload: { timelineId: "shot-2", hidden: true }
    });
    const renamed = await service.update({
      projectId: "project-1",
      operation: "edit-shot",
      payload: { timelineId: "shot-1", heading: "  1 Hallway " }
    });
    expect(renamed).toMatchObject({ heading: "1 Hallway", edited: null });

    const view = await service.getSnapshot("project-1");
    expect(
      (view!.cut!.hidden_shots as Array<Record<string, unknown>>).map(
        (shot) => shot.timeline_id
      )
    ).toEqual(["shot-2"]);
    expect(
      (view!.state!.shots as Array<Record<string, unknown>>).find(
        (shot) => shot.timeline_id === "shot-2"
      )
    ).toMatchObject({ hidden: true, manual: false });
    expect(storedShots(stored).every((shot) => !shot.edited)).toBe(true);
  });

  it("exposes the continuation text in effect and every option's default", async () => {
    const { service } = createSceneListService([
      castShot(1),
      castShot(2, { sequential: { enabled: true, opening_frame: "pin" } })
    ]);
    const view = await service.getSnapshot("project-1");
    const shots = view!.state!.shots as Array<Record<string, unknown>>;
    expect(shots[0]!.sequential_prompt).toBeNull();
    expect(String(shots[1]!.sequential_prompt)).toMatch(
      /^The last frame of the preceding shot, and this video opens exactly on it/u
    );
    expect(view?.state?.sequential_prompt_defaults).toMatchObject({
      last_frame: {
        cut: expect.any(String),
        pin: expect.any(String),
        off: expect.any(String)
      },
      key_frames: expect.any(String),
      last_chunk: expect.any(String)
    });
  });

  it("refuses to re-cast a project that has shots", async () => {
    const { service } = createSceneListService([castShot(1)]);
    await expect(
      service.cast({ projectId: "project-1", script: "INT. KITCHEN - DAY" })
    ).rejects.toThrow("casting a script into it again is disabled");
  });
});

describe("local Asset render queue", () => {
  const localRenderOf = (token: string) => ({
    projectId: "project-1",
    isDryRun: false,
    outputSize: [1024, 1024] as [number, number],
    settings: {
      prompt: `${token} again`,
      render_model: "qwen_image_2512_local"
    },
    tokens: [token]
  });

  const stubRenderSheets = () => {
    const finishers: Array<() => void> = [];
    const renderSheets = vi
      .spyOn(
        LocalScriptProjectService.prototype as unknown as {
          renderSheets: () => Promise<void>;
        },
        "renderSheets"
      )
      .mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishers.push(resolve);
          })
      );
    return { renderSheets, finishers };
  };

  it("queues a second render of a rendering Asset and starts it when the first ends", async () => {
    const { renderSheets, finishers } = stubRenderSheets();
    const { service } = createInMemoryScriptProjectStore({
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    });

    const first = await service.generateSheets(localRenderOf("mara"));
    const second = await service.generateSheets(localRenderOf("mara"));

    expect(first.plan_id).toEqual(expect.any(String));
    expect(second.plan_id).toEqual(expect.any(String));
    expect(second.plan_id).not.toBe(first.plan_id);
    expect(renderSheets).toHaveBeenCalledTimes(1);
    expect((await service.getPlan(String(second.plan_id)))?.status).toBe(
      "PENDING"
    );

    finishers[0]!();
    await waitForProjectRunToSettle();

    expect(renderSheets).toHaveBeenCalledTimes(2);
  });

  it("drops a queued render that is cancelled and keeps the running one", async () => {
    const { renderSheets, finishers } = stubRenderSheets();
    const { service } = createInMemoryScriptProjectStore({
      keys: [{ token: "mara", name: "Mara", prompt: "Mara", images: [] }],
      shots: []
    });

    await service.generateSheets(localRenderOf("mara"));
    const queued = await service.generateSheets(localRenderOf("mara"));
    await service.cancelPlan(String(queued.plan_id));

    finishers[0]!();
    await waitForProjectRunToSettle();

    expect(renderSheets).toHaveBeenCalledTimes(1);
  });
});
