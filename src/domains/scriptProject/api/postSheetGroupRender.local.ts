import { ensureCloudImageAsset } from "@domains/cloud/mirrorService";
import { RenderMode } from "@hooks/types";
import {
  SheetGenerateResult,
  SheetGenerateResultSchema,
  SheetKind
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import {
  canUseCloudSheetModels,
  executeCloudSheetPlan
} from "../cloudSheetRender.local";
import { SHEET_IMAGE_EDIT_MODEL_BY_RENDER_MODEL } from "../cloudSheetRender.local";
import {
  AnySheetRenderModel,
  DEFAULT_SHEET_IMAGE_FILE_TYPE,
  resolveLocalSheetRenderModel
} from "../constants";
import { isLocalScriptProject } from "../projectOrigin";
import { buildSheetReferencePrompt } from "../utils/buildSheetReferencePrompt";
import { isSheetRenderModel } from "../utils/isSheetRenderModel";

import { patchSheetGroup } from "./patchSheetGroup";

export type RenderSheetGroupRequest = {
  isNewSheetGroup?: boolean;
  projectId?: string;
  timelineId: string;
  token: string;
  name?: string;
  kind?: SheetKind | null;
  masterToken?: string | null;
  prompt: string;
  renderModel: AnySheetRenderModel;
  renderMode: RenderMode;
  outputSize: [number, number];
  referenceAssetIds?: string[];
  referenceInstruction?: string;
};

export const postSheetGroupRender = async (
  request: RenderSheetGroupRequest
): Promise<SheetGenerateResult | null> => {
  if (request.projectId && (await isLocalScriptProject(request.projectId))) {
    const isCloudModel =
      isSheetRenderModel(request.renderModel) && canUseCloudSheetModels();
    const result = SheetGenerateResultSchema.parse(
      await getLocalDesktopApi().scriptProjects.generateSheets({
        projectId: request.projectId,
        isDryRun: false,
        outputSize: request.outputSize,
        settings: {
          prompt: request.prompt,
          render_model: isCloudModel
            ? request.renderModel
            : resolveLocalSheetRenderModel(request.renderModel)
        },
        tokens: [request.token],
        ...(request.name === undefined && request.kind === undefined
          ? {}
          : {
              sheetGroupToCreate: {
                name: request.name,
                kind: request.kind
              }
            }),
        ...(request.referenceAssetIds === undefined
          ? {}
          : {
              referenceAssetIds: request.referenceAssetIds,
              referenceInstruction: request.referenceInstruction
            })
      })
    );
    if (isCloudModel && result.plan_id)
      void executeCloudSheetPlan(result.plan_id);
    return result;
  }
  if (request.projectId && request.masterToken) {
    const cloudApi = {
      post: async <T>(url: string, body?: unknown): Promise<T> =>
        (await backendApiClient.post<T>(url, body)).data,
      get: async <T>(url: string): Promise<T> =>
        (await backendApiClient.get<T>(url)).data
    };
    const cloudReferenceAssetIds = request.referenceAssetIds?.length
      ? await Promise.all(
          request.referenceAssetIds.map((assetId) =>
            ensureCloudImageAsset(cloudApi, assetId, request.projectId!)
          )
        )
      : undefined;
    const response = await backendApiClient.post(
      `/projects/${request.projectId}/sheets/generate`,
      {
        output_size: request.outputSize,
        settings: {
          render_model: request.renderModel,
          render_mode: request.renderMode
        },
        tokens: [request.token],
        ...(cloudReferenceAssetIds !== undefined
          ? {
              reference_asset_ids: cloudReferenceAssetIds,
              reference_instruction: request.referenceInstruction
            }
          : {}),
        dry_run: false
      }
    );
    return SheetGenerateResultSchema.parse(response.data);
  }
  const cloudReferenceIds =
    request.referenceAssetIds && request.projectId
      ? await Promise.all(
          request.referenceAssetIds.map((assetId) =>
            ensureCloudImageAsset(
              {
                post: async <T>(url: string, body?: unknown): Promise<T> =>
                  (await backendApiClient.post<T>(url, body)).data,
                get: async <T>(url: string): Promise<T> =>
                  (await backendApiClient.get<T>(url)).data
              },
              assetId,
              request.projectId!
            )
          )
        )
      : request.referenceAssetIds;
  const saveSheetGroupReferences = async (referenceAssetIds: string[]) =>
    patchSheetGroup({
      timelineId: request.timelineId,
      token: request.token,
      ...(request.isNewSheetGroup ? { prompt: request.prompt } : {}),
      referenceAssetIds,
      referenceInstruction: referenceAssetIds.length
        ? (request.referenceInstruction?.trim() ?? "")
        : null
    });
  if (cloudReferenceIds !== undefined && !request.isNewSheetGroup)
    await saveSheetGroupReferences(cloudReferenceIds);
  const [inputImageId, ...additionalReferences] = cloudReferenceIds ?? [];
  const [width, height] = request.outputSize;
  await backendApiClient.post(`/assets/img2img/render`, {
    timeline_id: request.timelineId,
    sheet_token: request.token,
    ...(request.name ? { sheet_name: request.name } : {}),
    ...(request.kind ? { sheet_kind: request.kind } : {}),
    img_file_type: DEFAULT_SHEET_IMAGE_FILE_TYPE,
    render_model:
      inputImageId && isSheetRenderModel(request.renderModel)
        ? SHEET_IMAGE_EDIT_MODEL_BY_RENDER_MODEL[request.renderModel]
        : request.renderModel,
    render_mode: request.renderMode,
    ...(inputImageId ? { source_asset: inputImageId, frame: 0 } : {}),
    settings: {
      prompt: inputImageId
        ? buildSheetReferencePrompt({
            prompt: request.prompt,
            referenceInstruction: request.referenceInstruction
          })
        : request.prompt,
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
  if (cloudReferenceIds !== undefined && request.isNewSheetGroup)
    await saveSheetGroupReferences(cloudReferenceIds);
  return null;
};
