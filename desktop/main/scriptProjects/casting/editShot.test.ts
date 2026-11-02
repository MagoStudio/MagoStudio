import { describe, expect, it } from "vitest";

import {
  applyShotEdit,
  editedShotResponse,
  ShotEditError,
  validateShotEdit
} from "./editShot";
import { materialiseCasting } from "./materialiseCasting";

const shot = () => ({
  timeline_id: "t1",
  key: "1.1",
  video_prompt: "Cast prompt.",
  dialogue: [{ speaker: "JOHN", speaker_token: "john", line: "Hello." }],
  cast_dialogue: [{ speaker: "JOHN", speaker_token: "john", line: "Hello." }],
  tags: { characters: ["john"], environments: ["field"], props: [] },
  atomic_duration_s: 3,
  duration_s: 3
});

const context = (
  overrides: Partial<Parameters<typeof validateShotEdit>[1]> = {}
) => ({
  shot: shot(),
  taggableTokens: new Set(["john", "mary", "field", "lantern"]),
  hasRenders: false,
  ...overrides
});

const refusal = (fields: Record<string, unknown>, ctx = context()) => {
  try {
    validateShotEdit(fields, ctx);
  } catch (error) {
    return error instanceof ShotEditError
      ? [error.status, error.message]
      : error;
  }
  return null;
};

describe("validateShotEdit (ProjectShotEdit.patch)", () => {
  it("refuses what the cloud refuses, with its messages and statuses", () => {
    expect(refusal({ camera: {} })).toEqual([400, "unknown field(s): camera"]);
    expect(refusal({})).toEqual([
      400,
      "nothing to change — send one of dialogue, duration_s, heading, hidden, locked, prompt_rewrite, sequential, shot_index, tags, video_prompt"
    ]);
    expect(refusal({ duration_s: 0 })).toEqual([
      400,
      "duration_s must be positive"
    ]);
    expect(refusal({ prompt_rewrite: "gemini" })).toEqual([
      400,
      "prompt_rewrite must be one of: mago, fal_balanced, fal_quality, raw, or null"
    ]);
    expect(refusal({ tags: { characters: ["ghost"] } })).toEqual([
      400,
      "tags.characters names entities this project cannot use: ghost"
    ]);
    expect(refusal({ locked: true })).toEqual([
      400,
      "A shot with no renders cannot be locked"
    ]);
    expect(
      refusal({ dialogue: [{ speaker_token: "mary", line: "Hi." }] })
    ).toEqual([
      400,
      "dialogue[0].speaker_token 'mary' is not a character tagged in this shot"
    ]);
    expect(
      refusal({ dialogue: Array.from({ length: 21 }, () => ({ line: "x" })) })
    ).toEqual([422, "dialogue has too many turns (max 20)"]);
    expect(
      refusal(
        { tags: { props: Array.from({ length: 21 }, (_, n) => `p${n}`) } },
        context({
          taggableTokens: new Set(Array.from({ length: 21 }, (_, n) => `p${n}`))
        })
      )
    ).toEqual([
      422,
      "a shot can feature at most 20 props, and every environment after the first counts as one; this one tags 21"
    ]);
  });

  it("accepts a speaker tagged in the same edit, and a lock once there are renders", () => {
    expect(
      refusal({
        tags: { characters: ["john", "mary"] },
        dialogue: [{ speaker_token: "mary", line: "Hi." }]
      })
    ).toBeNull();
    expect(refusal({ locked: true }, context({ hasRenders: true }))).toBeNull();
  });
});

describe("applyShotEdit (edit_shot)", () => {
  it("tracks each cast-owned field it changes", () => {
    const edited = applyShotEdit(shot(), {
      video_prompt: "Mine.",
      tags: { props: ["lantern"] }
    });
    expect(edited).toEqual(
      expect.objectContaining({
        video_prompt: "Mine.",
        tags: {
          characters: ["john"],
          environments: ["field"],
          props: ["lantern"]
        },
        edited: true,
        edited_fields: ["tags", "video_prompt"]
      })
    );
  });

  it("reverts null duration and dialogue to the cast's, and untracks them", () => {
    const edited = applyShotEdit(
      {
        ...shot(),
        duration_s: 8,
        dialogue: [],
        edited_fields: ["dialogue", "duration_s"]
      },
      { duration_s: null, dialogue: null }
    );
    expect(edited.duration_s).toBe(3);
    expect(edited.dialogue).toEqual(shot().cast_dialogue);
    expect(edited.edited_fields).toEqual([]);
  });

  it("does not mark a lock-only change as an edit", () => {
    const edited = applyShotEdit(shot(), { locked: true });
    expect(edited).toEqual(expect.objectContaining({ locked: true }));
    expect("edited" in edited).toBe(false);
    expect(
      editedShotResponse(applyShotEdit(edited, { locked: false })).locked
    ).toBe(false);
  });

  it("is what a later re-cast preserves", () => {
    const casting = {
      title: "T",
      sequences: [{ id: 1, heading: "EXT. FIELD - DAY" }],
      shots: [
        {
          id: "1.1",
          sequence_id: 1,
          action: "A",
          video_prompt: "First cast prompt.",
          characters: ["john"],
          environments: ["field"],
          props: [],
          beat_type: "physical_beat",
          duration_short_s: 3,
          duration_long_s: 4
        }
      ],
      characters: [
        {
          name: "John",
          token_name: "john",
          sequence_ids: [1],
          description: "J"
        }
      ],
      environments: [
        {
          name: "Field",
          token_name: "field",
          sequence_ids: [1],
          description: "F"
        }
      ],
      props: []
    };
    const first = materialiseCasting({ previousState: null, casting });
    const shots = first.state.shots as Array<Record<string, unknown>>;
    applyShotEdit(shots[0]!, { video_prompt: "My prompt." });
    const recast = materialiseCasting({
      previousState: first.state,
      casting: {
        ...casting,
        shots: [
          {
            ...casting.shots[0]!,
            video_prompt: "Second cast prompt.",
            duration_short_s: 4
          }
        ]
      }
    });
    const after = (recast.state.shots as Array<Record<string, unknown>>)[0]!;
    expect(after.video_prompt).toBe("My prompt.");
    expect(after.duration_s).toBe(4);
  });
});
