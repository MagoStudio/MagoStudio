import { describe, expect, it, vi } from "vitest";

import { createQwenVideoPromptCall } from "./qwenVideoPromptCall";
import {
  aspectRatioLabel,
  buildShotVideoPromptBody,
  resolvedDescription,
  shotPromptWithSequentialAppendix,
  storedCaptionFor
} from "./shotVideoPromptBody";
import { generateVideoPrompt } from "./videoPrompt";

type JsonRecord = Record<string, unknown>;

const keys = [
  {
    token: "hero",
    name: "Hero",
    seed_description: "casting seed",
    effective_asset_id: "img-hero",
    images: [
      {
        asset_id: "img-hero",
        description: "A courier in grey.",
        has_description: true
      }
    ]
  },
  {
    token: "villain",
    name: "Villain",
    seed_description: "A tall stranger.",
    images: []
  },
  { token: "lamp", name: "Lamp", seed_description: "", images: [] },
  { token: "map", name: "Map", seed_description: "Old map.", images: [] }
];

const shot = {
  video_prompt: "The hero meets the stranger.",
  tags: {
    characters: ["hero", "villain"],
    environments: [],
    props: ["lamp", "map"]
  },
  camera: { framing: "wide", movement: "slow push-in", lens: "" },
  dialogue: [
    { line: "You came.", speaker: "VILLAIN", speaker_token: "villain" }
  ],
  references: {
    characters: [
      { token: "hero", asset_id: "img-hero" },
      { token: "villain", asset_id: "img-villain" }
    ],
    props: [
      { token: "lamp", asset_id: "img-lamp" },
      { token: "map", asset_id: "img-map" }
    ]
  }
};

describe("buildShotVideoPromptBody", () => {
  it("pairs each slot with its asset, grids included, and the continuity frame last", () => {
    const body = buildShotVideoPromptBody({
      shot,
      keys,
      referenceSlots: [["img-hero"], ["img-villain"], ["img-lamp", "img-map"]],
      imageAssetIds: ["img-hero", "img-villain", "grid-1"],
      continuityImage: { id: "frame-1", description: "Continue from here." },
      continuityVideo: null,
      durationSeconds: 6,
      outputSize: [1280, 720],
      visualStyle: "Painterly"
    });
    expect(body.references).toEqual([
      {
        type: "reference_frame",
        asset_id: "img-hero",
        ref_id: "hero",
        description: "A courier in grey."
      },
      {
        type: "reference_frame",
        asset_id: "img-villain",
        ref_id: "villain",
        description: "A tall stranger."
      },
      {
        type: "reference_frame",
        asset_id: "grid-1",
        ref_id: "props_grid",
        members: ["lamp", "map"],
        description: "'Lamp'; 'Map' - Old map."
      },
      {
        type: "reference_frame",
        asset_id: "frame-1",
        ref_id: "prev_shot",
        description: "Continue from here."
      }
    ]);
    expect(body.shot).toEqual(
      expect.objectContaining({
        duration_s: 6,
        aspect_ratio: "16:9",
        style: "Painterly",
        camera: "wide; slow push-in"
      })
    );
  });

  it("refuses slots that describe different references", () => {
    expect(() =>
      buildShotVideoPromptBody({
        shot,
        keys,
        referenceSlots: [["img-hero"]],
        imageAssetIds: ["img-hero"],
        continuityImage: null,
        continuityVideo: null,
        durationSeconds: 6
      })
    ).toThrow("do not match the references being rendered");
  });

  it("composes a document numbered against what is sent", async () => {
    const body = buildShotVideoPromptBody({
      shot,
      keys,
      referenceSlots: [
        ["img-hero"],
        ["img-villain"],
        ["img-lamp"],
        ["img-map"]
      ],
      imageAssetIds: ["img-hero", "img-villain", "img-lamp", "img-map"],
      continuityImage: null,
      continuityVideo: { id: "prev-video", description: "Pick up the motion." },
      durationSeconds: 7
    });
    const result = await generateVideoPrompt(body, async () => {
      throw new Error("offline");
    });
    expect(result.references.map((entry) => entry.asset_id)).toEqual([
      "img-hero",
      "img-villain",
      "img-lamp",
      "img-map",
      "prev-video"
    ]);
    expect(result.task_types).toEqual(["video continuation"]);
    expect(result.sections.subject_definitions).toContain(
      "<Video 1>: Pick up the motion."
    );
    expect(result.sections.subject_definitions).not.toContain(
      "<Video 1> is a video clip showing"
    );
    expect(result.prompt).toContain("<d>[English] You came.</d>");
  });

  it("marks the continuity frame with its continuation", () => {
    const body = buildShotVideoPromptBody({
      shot,
      keys,
      referenceSlots: [["img-hero"], ["img-villain"], ["img-lamp", "img-map"]],
      imageAssetIds: ["img-hero", "img-villain", "grid-1"],
      continuityImage: {
        id: "frame-1",
        description: "Hold on the last frame.",
        continuation: "pin"
      },
      continuityVideo: null,
      durationSeconds: 6
    });
    expect((body.references as JsonRecord[]).at(-1)).toEqual({
      type: "reference_frame",
      asset_id: "frame-1",
      ref_id: "prev_shot",
      description: "Hold on the last frame.",
      continuation: "pin"
    });
  });

  it("never uses the heading as the shot description", () => {
    const body = buildShotVideoPromptBody({
      shot: { ...shot, video_prompt: "", heading: "3 INT. VAULT - NIGHT" },
      keys,
      referenceSlots: [["img-hero"], ["img-villain"], ["img-lamp", "img-map"]],
      imageAssetIds: ["img-hero", "img-villain", "grid-1"],
      continuityImage: null,
      continuityVideo: null,
      durationSeconds: 6
    });
    expect((body.shot as JsonRecord).description).toBe("");
  });
});

describe("shotPromptWithSequentialAppendix", () => {
  it("appends the appendix to the shot's own prompt when nothing composes it", () => {
    expect(
      shotPromptWithSequentialAppendix("The hero waits.", "  Continue on.  ")
    ).toBe("The hero waits. Continue on.");
    expect(shotPromptWithSequentialAppendix("", "Continue on.")).toBe(
      "Continue on."
    );
    expect(shotPromptWithSequentialAppendix("The hero waits.", "   ")).toBe(
      "The hero waits."
    );
  });
});

describe("helpers", () => {
  it("resolves a slot's description like sheet_groups.resolved_description", () => {
    expect(resolvedDescription(keys[0]!)).toBe("A courier in grey.");
    expect(resolvedDescription(keys[1]!)).toBe("A tall stranger.");
    expect(storedCaptionFor(keys)("img-hero")).toBe("A courier in grey.");
    expect(aspectRatioLabel([1080, 1920])).toBe("9:16");
    expect(aspectRatioLabel(undefined)).toBeNull();
  });
});

describe("createQwenVideoPromptCall", () => {
  const sections = {
    subject_definitions: "a",
    summary: "b",
    retention_analysis: "c",
    detailed_description: "d",
    overall_soundscape: "e",
    non_diegetic_music: "f"
  };

  it("asks once more when the answer is not the six-section object", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce('{"summary": "only"}')
      .mockResolvedValueOnce(`<think>x</think>${JSON.stringify(sections)}`);
    await expect(createQwenVideoPromptCall(run)(["PART"])).resolves.toEqual(
      sections
    );
    expect(run.mock.calls[0]![0]).toMatch(/^PART\n\nRESPONSE FORMAT:/);
    expect(run.mock.calls[1]![0]).toContain(
      "RETRY REQUIREMENT: The previous answer was rejected: these sections are missing or not strings"
    );
  });

  it("fails after the repair so the composer falls back to its skeleton", async () => {
    const run = vi.fn().mockResolvedValue("nope");
    await expect(createQwenVideoPromptCall(run)(["PART"])).rejects.toThrow(
      "Invalid video prompt from the local text model"
    );
  });
});
