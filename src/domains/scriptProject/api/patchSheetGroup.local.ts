import {
  SheetGroup,
  SheetGroupSchema,
  VoiceSignature
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type EditSheetGroupRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  voiceSignature?: VoiceSignature | null;
  name?: string;
  description?: string;
  prompt?: string;
  enabled?: boolean;
  bodyPlan?: "upright" | "four_legged" | null;
  referenceAssetIds?: string[] | null;
  referenceInstruction?: string | null;
};

export const patchSheetGroup = async (
  request: EditSheetGroupRequest
): Promise<SheetGroup> => {
  if (request.projectId && (await isLocalScriptProject(request.projectId))) {
    return SheetGroupSchema.parse(
      await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "edit-sheet",
        payload: {
          token: request.token,
          ...(request.name === undefined ? {} : { name: request.name }),
          ...(request.bodyPlan === undefined
            ? {}
            : { body_plan: request.bodyPlan }),
          ...(request.description === undefined
            ? {}
            : { description: request.description }),
          ...(request.prompt === undefined ? {} : { prompt: request.prompt }),
          ...(request.enabled === undefined
            ? {}
            : { enabled: request.enabled }),
          ...(request.referenceAssetIds === undefined
            ? {}
            : { reference_asset_ids: request.referenceAssetIds }),
          ...(request.referenceInstruction === undefined
            ? {}
            : { reference_instruction: request.referenceInstruction })
        }
      })
    );
  }
  const response = await backendApiClient.patch(
    `/timelines/${request.timelineId}/sheets/${encodeURIComponent(request.token)}/edit`,
    {
      ...(request.voiceSignature === undefined
        ? {}
        : { voice_signature: request.voiceSignature }),
      ...(request.name === undefined ? {} : { name: request.name }),
      ...(request.bodyPlan === undefined
        ? {}
        : { body_plan: request.bodyPlan }),
      ...(request.description === undefined
        ? {}
        : { description: request.description }),
      ...(request.prompt === undefined ? {} : { prompt: request.prompt }),
      ...(request.enabled === undefined ? {} : { enabled: request.enabled }),
      ...(request.referenceAssetIds === undefined
        ? {}
        : { reference_asset_ids: request.referenceAssetIds }),
      ...(request.referenceInstruction === undefined
        ? {}
        : { reference_instruction: request.referenceInstruction })
    }
  );
  return SheetGroupSchema.parse(response.data);
};
