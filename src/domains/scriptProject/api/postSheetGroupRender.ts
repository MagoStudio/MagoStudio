import { RenderMode } from "@hooks/types";
import {
  SheetGenerateResult,
  SheetGenerateResultSchema,
  SheetKind
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { DEFAULT_SHEET_IMAGE_FILE_TYPE, SheetRenderModel } from "../constants";
import { buildSheetReferencePrompt } from "../utils/buildSheetReferencePrompt";

import { patchSheetGroup } from "./patchSheetGroup";

const referenceRenderModels: Record<string, string> = {
  seedream_5_pro_t2i: "seedream_5_pro",
  gpt_image_2_t2i: "gpt_image_2",
  nanobanana_2_t2i: "nanobanana_2"
};

export type RenderSheetGroupRequest = {
  projectId?: string;
  isNewSheetGroup?: boolean;
  timelineId: string;
  token: string;
  name?: string;
  kind?: SheetKind | null;
  masterToken?: string | null;
  prompt: string;
  renderModel: SheetRenderModel;
  renderMode: RenderMode;
  outputSize: [number, number];
  referenceAssetIds?: string[];
  referenceInstruction?: string;
};

export const postSheetGroupRender = async ({
  projectId,
  isNewSheetGroup = false,
  timelineId,
  token,
  name,
  kind,
  masterToken,
  prompt,
  renderModel,
  renderMode,
  outputSize,
  referenceAssetIds,
  referenceInstruction
}: RenderSheetGroupRequest): Promise<SheetGenerateResult | null> => {
  if (projectId && masterToken) {
    const response = await backendApiClient.post(
      `/projects/${projectId}/sheets/generate`,
      {
        output_size: outputSize,
        settings: { render_model: renderModel, render_mode: renderMode },
        tokens: [token],
        ...(referenceAssetIds !== undefined
          ? {
              reference_asset_ids: referenceAssetIds,
              reference_instruction: referenceInstruction
            }
          : {}),
        dry_run: false
      }
    );
    return SheetGenerateResultSchema.parse(response.data);
  }
  const [inputImageId, ...additionalReferences] = referenceAssetIds ?? [];
  if (referenceAssetIds !== undefined && !isNewSheetGroup)
    await patchSheetGroup({
      timelineId,
      token,
      referenceAssetIds,
      referenceInstruction: inputImageId
        ? (referenceInstruction?.trim() ?? "")
        : null
    });
  const [width, height] = outputSize;

  await backendApiClient.post(`/assets/img2img/render`, {
    timeline_id: timelineId,
    sheet_token: token,
    ...(name ? { sheet_name: name } : {}),
    ...(kind ? { sheet_kind: kind } : {}),
    img_file_type: DEFAULT_SHEET_IMAGE_FILE_TYPE,
    render_model: inputImageId
      ? (referenceRenderModels[renderModel] ?? renderModel)
      : renderModel,
    render_mode: renderMode,
    ...(inputImageId ? { source_asset: inputImageId, frame: 0 } : {}),
    settings: {
      prompt: inputImageId
        ? buildSheetReferencePrompt({ prompt, referenceInstruction })
        : prompt,
      width,
      height,
      ...(inputImageId
        ? {
            input_image_id: inputImageId,
            reference_images: additionalReferences
          }
        : {})
    }
  });
  if (referenceAssetIds !== undefined && isNewSheetGroup)
    await patchSheetGroup({
      timelineId,
      token,
      prompt,
      referenceAssetIds,
      referenceInstruction: inputImageId
        ? (referenceInstruction?.trim() ?? "")
        : null
    });
  return null;
};
