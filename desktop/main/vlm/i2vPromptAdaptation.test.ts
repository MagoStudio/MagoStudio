import { describe, expect, it, vi } from "vitest";

import {
  adaptI2vPrompt,
  buildAdaptationPrompt,
  buildReferenceInventory,
  findLabelsPastEnd,
  renderEngineSlotLabels,
  repairSlotLabels,
  validateAdaptationDocument,
  type DescribedReferences
} from "./i2vPromptAdaptation";
import { ADAPT_PROMPT_I2V_INSTRUCTION } from "./prompts/adaptPromptI2vMinimaxH3";

const described = (
  image: string[] = [],
  video: string[] = []
): DescribedReferences => ({ image, video, audio: [] });

const ONE_IMAGE_ONE_VIDEO = described(["a woman in a red coat"], ["a street"]);

const validDocument = () => ({
  subject_definitions:
    "<Subject 1> is the woman in <Picture 1>, in a red wool coat.\n<Video 1> is the source clip being continued.",
  summary:
    "[video continuation + reference generation] <Subject 1> walks on from where <Video 1> ends.",
  retention_analysis:
    "<Subject 1> (appears in [Shot 1]): fully_preserved - face and coat.\n<Video 1> (continuation source): fully_preserved - the street.",
  detailed_description:
    "The target video is live-action. [Shot 1] <Subject 1> walks toward camera along the street from <Video 1>. [Shot 2] At 00:03.000, the shot cuts to a close-up as she stops.",
  overall_soundscape: "Footsteps on wet pavement and distant traffic.",
  non_diegetic_music: "N/A"
});

const answer = (value: unknown) =>
  `<think>brief</think>\n${JSON.stringify(value)}`;

describe("buildReferenceInventory", () => {
  it("numbers each kind by list position, as the backend does", () => {
    expect(
      buildReferenceInventory(
        described(["a woman in a red coat", "a rainy street"], ["handheld"]),
        "she walks",
        5,
        "16:9"
      )
    ).toBe(
      [
        "DURATION: 5",
        "ASPECT: 16:9",
        "IMAGES:",
        "  IMAGE_1: a woman in a red coat",
        "  IMAGE_2: a rainy street",
        "VIDEOS:",
        "  VIDEO_1: handheld",
        "USER_PROMPT: she walks"
      ].join("\n")
    );
  });

  it("leaves out absent kinds and the optional duration and aspect", () => {
    expect(buildReferenceInventory(described(), "she walks")).toBe(
      "USER_PROMPT: she walks"
    );
  });
});

describe("buildAdaptationPrompt", () => {
  it("sends the backend instruction verbatim, then the JSON envelope, then the inventory", () => {
    const prompt = buildAdaptationPrompt("USER_PROMPT: she walks");
    expect(prompt.startsWith(ADAPT_PROMPT_I2V_INSTRUCTION)).toBe(true);
    expect(prompt).toContain("OUTPUT ENVELOPE");
    expect(prompt.endsWith("USER_PROMPT: she walks")).toBe(true);
  });
});

describe("repairSlotLabels", () => {
  it("rewrites input-side labels to renderer labels and reports it", () => {
    const { text, warnings } = repairSlotLabels(
      "<Subject 1> is the man in <IMAGE_1>; <Picture 2> is the courtyard; also <VIDEO_1>."
    );
    expect(text).toBe(
      "<Subject 1> is the man in <Picture 1>; <Picture 2> is the courtyard; also <Video 1>."
    );
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("preserves slot numbers", () => {
    expect(repairSlotLabels("<IMAGE_3> and <IMAGE_1> and <AUDIO_2>").text).toBe(
      "<Picture 3> and <Picture 1> and <Audio 2>"
    );
  });

  it("leaves an already-correct prompt alone, silently", () => {
    const original =
      "<Subject 1> is the man in <Picture 1>, filmed as in <Video 1>.";
    expect(repairSlotLabels(original)).toEqual({
      text: original,
      warnings: []
    });
  });

  it("tolerates an empty prompt", () => {
    expect(repairSlotLabels("")).toEqual({ text: "", warnings: [] });
  });
});

describe("findLabelsPastEnd", () => {
  it("reports a label numbered past the references sent", () => {
    expect(
      findLabelsPastEnd("<Picture 5> is the sky", described(["a", "b"]))
    ).toEqual(["cites <Picture [5]> but only 2 image reference(s) were sent"]);
  });
});

describe("renderEngineSlotLabels", () => {
  it("keeps the canonical form for v9.1.0 and unknown engines", () => {
    expect(renderEngineSlotLabels("<Picture 1>", "v9.1.0").text).toBe(
      "<Picture 1>"
    );
    expect(renderEngineSlotLabels("<Picture 1>", "mystery").text).toBe(
      "<Picture 1>"
    );
  });

  it("renders fal's H3 Max form and leaves tags it cannot resolve", () => {
    const { text, warnings } = renderEngineSlotLabels(
      "<Picture 2> over <Video 1> with <Audio 1>",
      "minimax_h3_max"
    );
    expect(text).toBe("Image 2 over Video 1 with <Audio 1>");
    expect(warnings).toContain(
      "minimax_h3_max takes no audio references; left <Audio n> as written"
    );
  });
});

describe("validateAdaptationDocument", () => {
  it("accepts a well-formed document", () => {
    expect(
      validateAdaptationDocument(validDocument(), ONE_IMAGE_ONE_VIDEO, 6)
    ).toEqual([]);
  });

  it("reports what a repair needs to fix", () => {
    const errors = validateAdaptationDocument(
      {
        ...validDocument(),
        summary: "[remix] <Subject 2> walks.",
        detailed_description:
          "She walks past <Picture 3>. At 00:09.000 it ends."
      },
      ONE_IMAGE_ONE_VIDEO,
      6
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'unknown task type "remix"',
        "detailed_description must include [Shot 1]",
        "<Subject 2> is not defined in subject_definitions",
        "cites <Picture [3]> but only 1 image reference(s) were sent"
      ])
    );
  });

  it("requires every reference to be cited", () => {
    expect(
      validateAdaptationDocument(validDocument(), described(["a", "b"], ["v"]))
    ).toContain("reference <Picture 2> is never cited");
  });

  it("stops at missing or unexpected sections", () => {
    const { non_diegetic_music: _, ...partial } = validDocument();
    expect(
      validateAdaptationDocument(
        { ...partial, notes: "x" },
        ONE_IMAGE_ONE_VIDEO
      )
    ).toEqual([
      "missing section non_diegetic_music",
      "unexpected section notes"
    ]);
  });
});

describe("adaptI2vPrompt", () => {
  it("returns the backend's plain-text sections with repaired labels", async () => {
    const run = vi.fn().mockResolvedValue(
      answer({
        ...validDocument(),
        subject_definitions:
          "<Subject 1> is the woman in <IMAGE_1>.\n<VIDEO_1> is the source clip."
      })
    );
    const result = await adaptI2vPrompt({
      userPrompt: "she walks",
      described: ONE_IMAGE_ONE_VIDEO,
      run
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(result.adapted).toBe(true);
    expect(result.engine).toBe("v9.1.0");
    expect(result.adapted_prompt).toMatch(
      /^subject_definitions:\n<Subject 1> is the woman in <Picture 1>\.\n<Video 1>/
    );
    expect(result.adapted_prompt).toContain("\n\nnon_diegetic_music:\nN/A");
    expect(result.label_warnings).toEqual(
      expect.arrayContaining(["rewrote 1 IMAGE_k -> <Picture k> label(s)"])
    );
    expect(result.reference_inventory).toContain(
      "IMAGE_1: a woman in a red coat"
    );
  });

  it("retries once with the truncation hint when the answer is not JSON", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce('{"subject_definitions": "cut off')
      .mockResolvedValueOnce(answer(validDocument()));
    const result = await adaptI2vPrompt({
      userPrompt: "she walks",
      described: ONE_IMAGE_ONE_VIDEO,
      run
    });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]![0]).toContain("RETRY REQUIREMENT");
    expect(result.adapted).toBe(true);
  });

  it("repairs once with the validation errors and the rejected JSON", async () => {
    const rejected = { ...validDocument(), summary: "no prefix" };
    const run = vi
      .fn()
      .mockResolvedValueOnce(answer(rejected))
      .mockResolvedValueOnce(answer(validDocument()));
    const result = await adaptI2vPrompt({
      userPrompt: "she walks",
      described: ONE_IMAGE_ONE_VIDEO,
      run
    });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]![0]).toContain(
      "VALIDATION_ERRORS: summary must begin with a [task type] prefix"
    );
    expect(run.mock.calls[1]![0]).toContain('"summary":"no prefix"');
    expect(result.label_warnings).toEqual([]);
  });

  it("keeps a usable first answer, with warnings, when the repair is worse", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce(answer({ ...validDocument(), summary: "x" }))
      .mockResolvedValueOnce("not json at all");
    const result = await adaptI2vPrompt({
      userPrompt: "she walks",
      described: ONE_IMAGE_ONE_VIDEO,
      run
    });
    expect(result.adapted).toBe(true);
    expect(result.adapted_prompt).toContain("summary:\nx");
    expect(result.label_warnings).toContain(
      "summary must begin with a [task type] prefix"
    );
  });

  it("falls back to the raw prompt when no answer has all six sections", async () => {
    const run = vi.fn().mockResolvedValue("I cannot help with that.");
    await expect(
      adaptI2vPrompt({
        userPrompt: "she walks",
        described: ONE_IMAGE_ONE_VIDEO,
        run
      })
    ).resolves.toEqual({ adapted_prompt: "she walks", adapted: false });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("surfaces a model that cannot be reached", async () => {
    const run = vi.fn().mockRejectedValue(new Error("ComfyUI is unavailable"));
    await expect(
      adaptI2vPrompt({ userPrompt: "she walks", described: described(), run })
    ).rejects.toThrow("ComfyUI is unavailable");
  });

  it("renders tags in the requested engine's form", async () => {
    const run = vi.fn().mockResolvedValue(answer(validDocument()));
    const result = await adaptI2vPrompt({
      userPrompt: "she walks",
      described: ONE_IMAGE_ONE_VIDEO,
      engine: "minimax_h3_max",
      run
    });
    expect(result.adapted_prompt).toContain("the woman in Image 1");
    expect(result.adapted_prompt).not.toContain("<Picture 1>");
  });
});
