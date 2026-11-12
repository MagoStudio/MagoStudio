import { describe, expect, it, vi } from "vitest";

import {
  generateVideoPrompt,
  LOCAL_VIDEO_PROMPT_ENGINE,
  PINNED_CAMERA,
  VideoPromptError
} from "./videoPrompt";

const payload = (durationS: number) => ({
  shot: { description: "the courier waits", duration_s: durationS },
  characters: [{ id: "hero", name: "Hero", description: "A courier." }],
  references: [{ type: "reference_frame", asset_id: "a-hero", ref_id: "hero" }]
});

const failingModel = async () => {
  throw new Error("unreachable");
};

describe("generateVideoPrompt on the local H3 engine", () => {
  it.each(["minimax_h3_local", "minimax_h3_max"])(
    "keeps audio rendering excluded for %s after metadata parity updates",
    async (engineVersion) => {
      const callModel = vi.fn();
      await expect(
        generateVideoPrompt(
          {
            ...payload(6.4),
            references: [
              {
                type: "reference_audio",
                asset_id: "voice-asset",
                voice_of: "hero"
              }
            ]
          },
          callModel,
          { engineVersion }
        )
      ).rejects.toThrow(
        new VideoPromptError(`${engineVersion} takes no audio references`, 422)
      );
      expect(callModel).not.toHaveBeenCalled();
    }
  );
  it("tags references canonically and keeps the shot's own length", async () => {
    const result = await generateVideoPrompt(payload(6.4), failingModel);
    expect(result.labels.map((label) => label.label)).toEqual([
      "<Picture 1>",
      "<Subject 1>"
    ]);
    expect(result.timing).toEqual(
      expect.objectContaining({ effective_duration_s: 6.4, frames: 154 })
    );
    expect(result.fallback).toBe(true);
    expect(result.prompt).toContain(
      "<Subject 1> is the character in this shot"
    );
    expect(result.prompt).toContain("Approximately 6.4 seconds, 16:9.");
  });

  it("refuses a length outside the 5-15 s window", async () => {
    await expect(generateVideoPrompt(payload(4), failingModel)).rejects.toThrow(
      new VideoPromptError("minimax_h3_local renders 5-15s; got 4.0s", 422)
    );
  });
});

const continuingPayload = (continuation: "cut" | "pin", description = "") => ({
  shot: {
    description: "the courier keeps talking",
    duration_s: 6,
    camera: "slow push-in"
  },
  characters: [{ id: "hero", name: "Hero", description: "A courier." }],
  references: [
    { type: "reference_frame", asset_id: "a-hero", ref_id: "hero" },
    {
      type: "reference_frame",
      asset_id: "a-frame",
      ref_id: "prev_shot",
      continuation,
      ...(description ? { description } : {})
    }
  ]
});

const lookReferenceAnswer = {
  subject_definitions:
    "{{subject:hero}} is the hero, as shown in {{ref:hero}}.\n" +
    "- {{ref:prev_shot}} is a look reference for the room,\n" +
    "  wrapped onto a second line.\n" +
    "{{subject:hero}} stands where {{ref:prev_shot}} left him.",
  summary: "[reference generation] The courier keeps talking.",
  retention_analysis:
    "{{ref:hero}}: weak_reference - the courier.\n" +
    "{{ref:prev_shot}}: weak_reference - its look only.",
  detailed_description: `[Shot 1] The courier talks. ${"detail ".repeat(360)}`,
  overall_soundscape: "Room tone.",
  non_diegetic_music: "N/A"
};

describe("continuing from the previous shot", () => {
  it("replaces the model's line for the previous frame, wrapped line included", async () => {
    const result = await generateVideoPrompt(
      continuingPayload("cut", "Same moment, new angle."),
      async () => lookReferenceAnswer
    );
    expect(result.fallback).toBe(false);
    expect(result.sections.subject_definitions).toBe(
      "<Subject 1> is the hero, as shown in <Picture 1>.\n" +
        "<Subject 1> stands where <Picture 2> left him.\n" +
        "<Picture 2>: Same moment, new angle."
    );
    expect(result.sections.retention_analysis).toBe(
      "<Picture 1>: weak_reference - the courier.\n" +
        "<Picture 2>: partially_preserved - who is where, their poses, the setting and the light; not its framing."
    );
    expect(result.retention["<Picture 2>"]).toBe("partially_preserved");
  });

  it("keeps the model's sections when its scene overview is not text", async () => {
    const result = await generateVideoPrompt(
      continuingPayload("cut"),
      async () => ({
        ...lookReferenceAnswer,
        scene_overview: { text: "The courier talks." }
      })
    );
    expect(result.fallback).toBe(false);
    expect(result.scene_overview).toBeNull();
  });

  it("briefs the model with a Continuity block", async () => {
    const sent: string[][] = [];
    await generateVideoPrompt(continuingPayload("cut"), async (contents) => {
      sent.push(contents);
      throw new Error("offline");
    });
    expect(sent[0]!.find((part) => part.startsWith("## Continuity"))).toContain(
      "{{ref:prev_shot}} is the last frame of the preceding shot, and this shot is a new camera angle"
    );
  });

  it("replaces a pinned shot's camera with a locked-off hold", async () => {
    const sent: string[][] = [];
    const result = await generateVideoPrompt(
      continuingPayload("pin"),
      async (contents) => {
        sent.push(contents);
        throw new Error("offline");
      }
    );
    expect(result.task_types).toEqual([
      "reference generation",
      "keyframe completion"
    ]);
    expect(result.retention["<Picture 2>"]).toBe("fully_preserved");
    expect(result.warnings).toContain(
      "the shot opens on the previous shot's last frame, so its camera " +
        "('slow push-in') is replaced by a locked-off hold on that frame"
    );
    expect(result.sections.detailed_description).toContain(
      "Camera: Locked off, holding the opening frame's framing"
    );
    expect(result.sections.detailed_description).not.toContain("push-in");
    expect(sent[0]!.find((part) => part.startsWith("## Shot data"))).toContain(
      PINNED_CAMERA
    );
    expect(
      result.labels.find((label) => label.label === "<Picture 2>")
    ).toEqual(
      expect.objectContaining({ continuation: "pin", character_sheet: false })
    );
  });
});

describe("local engine references", () => {
  it("refuses an audio reference: character voice is cloud-only", async () => {
    await expect(
      generateVideoPrompt(
        {
          shot: { description: "x", duration_s: 6 },
          references: [{ type: "reference_audio", asset_id: "voice" }]
        },
        async () => ({})
      )
    ).rejects.toMatchObject({
      message: `${LOCAL_VIDEO_PROMPT_ENGINE} takes no audio references`,
      status: 422
    });
  });
});
