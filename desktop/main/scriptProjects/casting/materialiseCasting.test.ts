import { describe, expect, it } from "vitest";

import {
  HEADING_EDITED_KEY,
  lengthWarning,
  materialiseCasting,
  numberedHeadings,
  parseTargetDurationS
} from "./materialiseCasting";

const entity = (
  name: string,
  token: string,
  ids: number[],
  description: string
) => ({
  name,
  token_name: token,
  sequence_ids: ids,
  description,
  t2i_prompt: `${name} turnaround`
});

/** One scene, two beats, the shape an atomic cast hands to materialisation. */
const casting = (overrides: Record<string, unknown> = {}) => ({
  title: "Duel",
  sequences: [{ id: 1, heading: "EXT. FIELD - DAY", dialogue: [] }],
  shots: [
    {
      id: "1.1",
      sequence_id: 1,
      action: "Hudson waits.",
      video_prompt: "Hudson waits in the field.",
      characters: ["hudson"],
      environments: ["field"],
      props: [],
      beat_type: "physical_beat",
      duration_short_s: 2.5,
      duration_long_s: 4
    },
    {
      id: "1.2",
      sequence_id: 1,
      action: "John arrives.",
      video_prompt: "John walks in.",
      characters: ["john", "hudson"],
      environments: ["field"],
      props: [],
      dialogue: [
        { speaker: "JOHN", line: "I always come back.", language: "English" }
      ],
      beat_type: "contained_reaction",
      duration_short_s: 2,
      duration_long_s: 3.25
    }
  ],
  characters: [
    entity("Mrs. Hudson", "hudson", [1], "A sharp-eyed landlady."),
    entity("John", "john", [1], "A tired doctor.")
  ],
  environments: [entity("Field", "field", [1], "Open grass.")],
  props: [],
  ...overrides
});

describe("materialiseCasting", () => {
  it("creates one key per used entity and one shot per beat, unpacked", () => {
    const { state, summary } = materialiseCasting({
      previousState: null,
      casting: casting(),
      scriptVersion: 1
    });
    expect(
      (state.keys as Array<Record<string, unknown>>).map((key) => key.token)
    ).toEqual(["field", "hudson", "john"]);
    expect(state.keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          token: "hudson",
          kind: "character",
          seed_description: "A sharp-eyed landlady.",
          prompt: "Mrs. Hudson turnaround",
          enabled: true,
          layer_order: 10001,
          images: []
        })
      ])
    );
    const shots = state.shots as Array<Record<string, unknown>>;
    expect(shots.map((shot) => shot.key)).toEqual(["1.1", "1.2"]);
    expect(shots[1]).toEqual(
      expect.objectContaining({
        heading: "1.2 EXT. FIELD - DAY",
        action: "John arrives.",
        duration_s: 2,
        atomic_duration_s: 2,
        script_version: 1,
        dropped: false,
        tags: {
          characters: ["john", "hudson"],
          environments: ["field"],
          props: []
        },
        dialogue: [
          expect.objectContaining({ speaker: "JOHN", speaker_token: "john" })
        ]
      })
    );
    expect(summary).toEqual({
      keys_added: ["field", "hudson", "john"],
      keys_kept: [],
      keys_unused: [],
      shots_added: ["1.1", "1.2"],
      shots_kept: [],
      shots_dropped: [],
      dropped_entities: [],
      sequence_warnings: [],
      planned_total_s: null,
      target_duration_s: null,
      length_warning: null
    });
  });

  it("packs the beats into one render sequence when asked", () => {
    const { state } = materialiseCasting({
      previousState: null,
      casting: casting(),
      renderSequences: true
    });
    const shots = state.shots as Array<Record<string, unknown>>;
    expect(shots).toHaveLength(1);
    expect(shots[0]).toEqual(
      expect.objectContaining({
        key: "rseq_1_1",
        heading: "1 EXT. FIELD - DAY",
        duration_s: expect.any(Number)
      })
    );
    expect(shots[0]!.video_prompt).toContain("[Shot 1]");
    expect(shots[0]!.video_prompt).toContain("[Shot 2]");
  });

  it("warns and stays unpacked when packing has no beats to pack", () => {
    const { state, summary } = materialiseCasting({
      previousState: null,
      casting: casting({
        shots: [],
        sequences: [
          {
            id: 1,
            heading: "EXT. FIELD - DAY",
            video_prompt: "They meet.",
            characters: ["hudson"],
            environments: ["field"],
            props: []
          }
        ]
      }),
      renderSequences: true
    });
    expect((state.shots as unknown[]).length).toBe(1);
    expect(summary.sequence_warnings).toEqual([
      { key: null, warnings: [expect.stringContaining("no atomic shots[]")] }
    ]);
  });

  it("re-casts in place: keeps user edits and images, disables and drops what left", () => {
    const first = materialiseCasting({
      previousState: null,
      casting: casting()
    });
    const keys = (first.state.keys as Array<Record<string, unknown>>).map(
      (key) =>
        key.token === "hudson"
          ? {
              ...key,
              prompt: "My own prompt",
              images: [{ asset_id: "a1", status: "success" }],
              effective_asset_id: "a1"
            }
          : key
    );
    const shots = (first.state.shots as Array<Record<string, unknown>>).map(
      (shot) =>
        shot.key === "1.2"
          ? {
              ...shot,
              video_prompt: "My own shot",
              edited: true,
              edited_fields: ["video_prompt"]
            }
          : shot
    );
    const timelineIds = shots.map((shot) => shot.timeline_id);

    const recast = casting({
      shots: [
        // 1.1 is gone; 1.2 stays with a new prompt and duration; 1.3 is new.
        {
          ...casting().shots[1],
          video_prompt: "John strides in.",
          duration_short_s: 3
        },
        {
          id: "1.3",
          sequence_id: 1,
          action: "They shake hands.",
          video_prompt: "A handshake.",
          characters: ["john"],
          environments: ["field"],
          props: [],
          beat_type: "physical_beat",
          duration_short_s: 2.5,
          duration_long_s: 4
        }
      ],
      characters: [entity("John", "john", [1], "A tired doctor.")]
    });
    const second = materialiseCasting({
      previousState: { ...first.state, keys, shots },
      casting: recast,
      scriptVersion: 2
    });

    const hudson = (second.state.keys as Array<Record<string, unknown>>).find(
      (key) => key.token === "hudson"
    );
    expect(hudson).toEqual(
      expect.objectContaining({
        enabled: false,
        prompt: "My own prompt",
        images: [{ asset_id: "a1", status: "success" }]
      })
    );

    const byKey = new Map(
      (second.state.shots as Array<Record<string, unknown>>).map((shot) => [
        shot.key,
        shot
      ])
    );
    expect(byKey.get("1.1")).toEqual(
      expect.objectContaining({ dropped: true, timeline_id: timelineIds[0] })
    );
    expect(byKey.get("1.2")).toEqual(
      expect.objectContaining({
        dropped: false,
        timeline_id: timelineIds[1],
        video_prompt: "My own shot",
        duration_s: 3,
        script_version: 2,
        edited_fields: ["video_prompt"]
      })
    );
    expect(byKey.get("1.3")).toEqual(
      expect.objectContaining({ dropped: false })
    );
    expect(second.summary).toEqual(
      expect.objectContaining({
        keys_added: [],
        keys_kept: ["field", "john"],
        keys_unused: ["hudson"],
        shots_added: ["1.3"],
        shots_kept: ["1.2"],
        shots_dropped: ["1.1"]
      })
    );
  });

  it("numbers each sequence in cast order and the shots of a sequence with dots", () => {
    const { state } = materialiseCasting({
      previousState: null,
      casting: twoSequenceCasting()
    });
    expect(headingsOf(state)).toEqual([
      "1.1 EXT. FIELD - DAY",
      "1.2 EXT. FIELD - DAY",
      "2 INT. BARN - NIGHT"
    ]);
  });

  it("keeps a renamed heading through a re-cast", () => {
    const first = materialiseCasting({
      previousState: null,
      casting: twoSequenceCasting()
    });
    const renamedShots = (
      first.state.shots as Array<Record<string, unknown>>
    ).map((shot) =>
      shot.key === "1.1"
        ? { ...shot, heading: "1 My title", [HEADING_EDITED_KEY]: true }
        : shot
    );
    const second = materialiseCasting({
      previousState: { ...first.state, shots: renamedShots },
      casting: twoSequenceCasting(),
      scriptVersion: 2
    });
    expect(headingsOf(second.state)).toEqual([
      "1 My title",
      "1.2 EXT. FIELD - DAY",
      "2 INT. BARN - NIGHT"
    ]);
  });

  it("reports the planned total and warns when it overshoots the target", () => {
    const { summary } = materialiseCasting({
      previousState: null,
      casting: twoSequenceCasting(),
      renderSequences: true,
      targetDurationS: 1
    });
    expect(summary.target_duration_s).toBe(1);
    expect(summary.planned_total_s).toBeGreaterThan(1);
    expect(summary.length_warning).toContain("target");
  });

  it("reports the planned total without a warning when no target is given", () => {
    const { summary } = materialiseCasting({
      previousState: null,
      casting: twoSequenceCasting(),
      renderSequences: true
    });
    expect(summary.target_duration_s).toBeNull();
    expect(summary.length_warning).toBeNull();
    expect(summary.planned_total_s).toBeGreaterThan(0);
  });

  it("does not warn when the cut fits the target", () => {
    const { summary } = materialiseCasting({
      previousState: null,
      casting: twoSequenceCasting(),
      renderSequences: true,
      targetDurationS: 10_000
    });
    expect(summary.length_warning).toBeNull();
  });
});

const twoSequenceCasting = () => {
  const base = casting();
  return casting({
    sequences: [
      ...base.sequences,
      { id: 2, heading: "INT. BARN - NIGHT", dialogue: [] }
    ],
    shots: [
      ...base.shots,
      {
        id: "2.1",
        sequence_id: 2,
        action: "Hudson hides.",
        video_prompt: "Hudson hides in the barn.",
        characters: ["hudson"],
        environments: ["barn"],
        props: [],
        beat_type: "physical_beat",
        duration_short_s: 2,
        duration_long_s: 3
      }
    ],
    environments: [
      entity("Field", "field", [1], "Open grass."),
      entity("Barn", "barn", [2], "A dark barn.")
    ]
  });
};

const headingsOf = (state: Record<string, unknown>): unknown[] =>
  (state.shots as Array<Record<string, unknown>>).map((shot) => shot.heading);

describe("numberedHeadings", () => {
  it("counts sequences in cast order, not by id", () => {
    const shots = [
      { sequence_id: 7, heading: "A" },
      { sequence_id: 7, heading: "A" },
      { sequence_id: 3, heading: "B" },
      { sequence_id: null, heading: null },
      { sequence_id: 4, heading: "C" },
      { sequence_id: null, heading: "D" }
    ];
    expect(numberedHeadings(shots).map((shot) => shot.heading)).toEqual([
      "1.1 A",
      "1.2 A",
      "2 B",
      "3",
      "4 C",
      "5 D"
    ]);
  });
});

describe("parseTargetDurationS", () => {
  it("accepts a positive number and leaves an absent one off", () => {
    expect(parseTargetDurationS(null)).toEqual([null, null]);
    expect(parseTargetDurationS(undefined)).toEqual([null, null]);
    expect(parseTargetDurationS(30)).toEqual([30, null]);
  });

  it.each([0, -5, true, "30", Number.NaN, Infinity, -Infinity])(
    "rejects %s",
    (value) => {
      const [seconds, message] = parseTargetDurationS(value);
      expect(seconds).toBeNull();
      expect(message).toBe("target_duration_s must be a positive number");
    }
  );
});

describe("lengthWarning", () => {
  it("tolerates max(6s, 10% of the render) and never flags an undershoot", () => {
    expect(lengthWarning(35, 30)).toBeNull();
    expect(lengthWarning(37, 30)).not.toBeNull();
    expect(lengthWarning(38, 30)).not.toBeNull();
    expect(lengthWarning(655, 600)).toBeNull();
    expect(lengthWarning(760, 600)).not.toBeNull();
    expect(lengthWarning(10, 30)).toBeNull();
  });

  it("words the overshoot like the backend", () => {
    expect(lengthWarning(37.5, 30)).toBe(
      "planned 37.5s is 7.5s over the 30s target; shorten or merge shots, or raise the target"
    );
  });
});
