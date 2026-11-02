import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { mirrorImg2ImgSettings } from "@domains/cloud/mirrorImg2ImgSettings";
import { ensureCloudImageAsset } from "@domains/cloud/mirrorService";
import { CreatePlanRequest, Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const createPlan = async (data: CreatePlanRequest): Promise<Plan> => {
  const cloudApi = backendCloudApi();
  const mirrorImageToCloud = (localAssetId: string) =>
    ensureCloudImageAsset(cloudApi, localAssetId, data.project_id);

  const cloudImg2ImgSettings = data.img2img_settings
    ? ((await mirrorImg2ImgSettings(
        data.img2img_settings,
        mirrorImageToCloud
      )) as CreatePlanRequest["img2img_settings"])
    : undefined;

  const cloudShotOverrides: CreatePlanRequest["shot_overrides"] = {};
  for (const [shotId, shotOverride] of Object.entries(
    data.shot_overrides ?? {}
  )) {
    const cloudImages = [];
    for (const image of shotOverride.images ?? []) {
      cloudImages.push({
        ...image,
        asset_id: await mirrorImageToCloud(image.asset_id)
      });
    }
    cloudShotOverrides[shotId] = shotOverride.images
      ? { ...shotOverride, images: cloudImages }
      : shotOverride;
  }

  const response = await backendApiClient.post<Plan>("/agent/plans", {
    ...data,
    ...(cloudImg2ImgSettings ? { img2img_settings: cloudImg2ImgSettings } : {}),
    ...(data.shot_overrides ? { shot_overrides: cloudShotOverrides } : {})
  });
  return response.data;
};
