import { describe, expect, it } from "vitest";

import { buildSheetReferencePrompt } from "./buildSheetReferencePrompt";
import { readSheetImageVersionSettings } from "./readSheetImageVersionSettings";
import { VISUAL_STYLE_INSTRUCTION_PREFIX } from "./stripSheetPromptComposedSuffixes";

describe("readSheetImageVersionSettings", () => {
  it("reads the settings the user chose from a bulk render's spec", () => {
    expect(
      readSheetImageVersionSettings({
        render_spec: {
          kind: "sheet",
          prompt: `a rugged sergeant\n\n${VISUAL_STYLE_INSTRUCTION_PREFIX}grainy 16mm`,
          render_model: "gpt_image_2_t2i",
          output_size: [1024, 1536],
          reference_asset_ids: ["reference-1"],
          reference_instruction: "match the face",
          visual_style: "grainy 16mm"
        }
      })
    ).toEqual({
      prompt: "a rugged sergeant",
      sheetRenderModel: "gpt_image_2_t2i",
      outputSize: [1024, 1536],
      referenceAssetIds: ["reference-1"],
      referenceInstruction: "match the face",
      visualStyle: "grainy 16mm"
    });
  });

  it("falls back to the image's reference list when a single render recorded only its prompt", () => {
    expect(
      readSheetImageVersionSettings({
        render_spec: {
          prompt: buildSheetReferencePrompt({
            prompt: "a typed-over prompt",
            referenceInstruction: "match the face"
          }),
          render_model: "gpt_image_2_edit"
        },
        reference_asset_ids: ["reference-1"]
      })
    ).toEqual({
      prompt: "a typed-over prompt",
      sheetRenderModel: undefined,
      outputSize: undefined,
      referenceAssetIds: ["reference-1"],
      referenceInstruction: undefined,
      visualStyle: undefined
    });
  });

  it.each([
    ["input_settings", { input_settings: { prompt: "a cloud prompt" } }],
    ["_local_render_spec", { _local_render_spec: { prompt: "a cloud prompt" } }]
  ])("reads a render that recorded its settings under %s", (_, image) => {
    expect(readSheetImageVersionSettings(image)?.prompt).toBe("a cloud prompt");
  });

  it("falls back to the image's recorded prompt when no settings were recorded", () => {
    expect(
      readSheetImageVersionSettings({
        render_spec: null,
        prompt: "a recorded prompt"
      })?.prompt
    ).toBe("a recorded prompt");
  });

  it("returns null for an upload, which rendered nothing", () => {
    expect(readSheetImageVersionSettings({ render_spec: null })).toBeNull();
  });
});
