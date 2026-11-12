import { SheetImage } from "@schemas/scriptProject";

import { SheetRenderModel } from "../constants";

import { isSheetRenderModel } from "./isSheetRenderModel";
import { stripSheetPromptComposedSuffixes } from "./stripSheetPromptComposedSuffixes";

export type SheetImageVersionSettings = {
  prompt: string | undefined;
  sheetRenderModel: SheetRenderModel | undefined;
  outputSize: [number, number] | undefined;
  referenceAssetIds: string[];
  referenceInstruction: string | undefined;
  visualStyle: string | undefined;
};

const readNonBlankString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const isOutputSize = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((sidePx) => typeof sidePx === "number" && sidePx > 0);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const readSheetImageVersionSettings = (
  image: Partial<
    Pick<
      SheetImage,
      | "render_spec"
      | "input_settings"
      | "_local_render_spec"
      | "prompt"
      | "reference_asset_ids"
    >
  >
): SheetImageVersionSettings | null => {
  const renderSpec =
    image.render_spec ?? image.input_settings ?? image._local_render_spec;
  const recordedPrompt =
    readNonBlankString(renderSpec?.prompt) ?? readNonBlankString(image.prompt);
  if (!renderSpec && !recordedPrompt) return null;
  return {
    prompt: recordedPrompt && stripSheetPromptComposedSuffixes(recordedPrompt),
    sheetRenderModel: isSheetRenderModel(renderSpec?.render_model)
      ? renderSpec.render_model
      : undefined,
    outputSize: isOutputSize(renderSpec?.output_size)
      ? renderSpec.output_size
      : undefined,
    referenceAssetIds: isStringList(renderSpec?.reference_asset_ids)
      ? renderSpec.reference_asset_ids
      : (image.reference_asset_ids ?? []),
    referenceInstruction: readNonBlankString(renderSpec?.reference_instruction),
    visualStyle: readNonBlankString(renderSpec?.visual_style)
  };
};
