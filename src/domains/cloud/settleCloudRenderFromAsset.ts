import { getLocalDesktopApi } from "@/platform/localDesktop";

import { CloudApi } from "./mirrorService";
import { readCloudRenderAsset } from "./readCloudRenderAsset";

export type CloudRenderSettlement = "finished" | "failed" | "waiting";

export type PendingCloudRenderOutputMeaning = "still-rendering" | "cancelled";

export const CANCELLED_CLOUD_RENDER_MESSAGE = "The cloud render was cancelled";

export const settleCloudRenderFromAsset = async (
  api: CloudApi,
  job: { id: string; cloudAssetId: string },
  pendingOutputMeaning: PendingCloudRenderOutputMeaning
): Promise<CloudRenderSettlement> => {
  const renders = getLocalDesktopApi().cloud.renders;
  const asset = await readCloudRenderAsset(api, job.cloudAssetId);

  if (asset.kind === "unreachable") return "waiting";

  if (asset.kind === "failed") {
    await renders.fail({ jobId: job.id, message: asset.reason });
    return "failed";
  }

  if (asset.kind === "pending") {
    if (pendingOutputMeaning === "still-rendering") return "waiting";
    await renders.fail({
      jobId: job.id,
      message: CANCELLED_CLOUD_RENDER_MESSAGE
    });
    return "failed";
  }

  try {
    await renders.finish({ jobId: job.id, url: asset.url });
    return "finished";
  } catch {
    return "waiting";
  }
};
