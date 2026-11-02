import { SheetGroup, SheetGroupSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type EditSheetGroupRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  name?: string;
  description?: string;
  prompt?: string;
  enabled?: boolean;
  bodyPlan?: "upright" | "four_legged" | null;
  referenceAssetIds?: string[] | null;
  referenceInstruction?: string | null;
};

export const patchSheetGroup = async ({
  timelineId,
  token,
  name,
  description,
  prompt,
  enabled,
  bodyPlan,
  referenceAssetIds,
  referenceInstruction
}: EditSheetGroupRequest): Promise<SheetGroup> => {
  const response = await backendApiClient.patch(
    `/timelines/${timelineId}/sheets/${encodeURIComponent(token)}/edit`,
    {
      ...(name === undefined ? {} : { name }),
      ...(description === undefined ? {} : { description }),
      ...(prompt === undefined ? {} : { prompt }),
      ...(enabled === undefined ? {} : { enabled }),
      ...(bodyPlan === undefined ? {} : { body_plan: bodyPlan }),
      ...(referenceAssetIds === undefined
        ? {}
        : { reference_asset_ids: referenceAssetIds }),
      ...(referenceInstruction === undefined
        ? {}
        : { reference_instruction: referenceInstruction })
    }
  );
  return SheetGroupSchema.parse(response.data);
};
