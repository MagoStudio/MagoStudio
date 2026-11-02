import { classifyCloudRequestFailure } from "./classifyCloudRequestFailure";
import { CloudApi } from "./mirrorService";

export type CloudRenderAssetState =
  | { kind: "ready"; url: string }
  | { kind: "pending" }
  | { kind: "failed"; reason: string }
  | { kind: "unreachable" };

const HTTP_NOT_FOUND = 404;

const describeRejectedAsset = (httpStatus: number, reason: string): string => {
  if (httpStatus === HTTP_NOT_FOUND) {
    return "The cloud render no longer exists in Mago cloud";
  }
  return (
    reason || `Mago cloud could not deliver the render (HTTP ${httpStatus})`
  );
};

export const readCloudRenderAsset = async (
  api: CloudApi,
  cloudAssetId: string
): Promise<CloudRenderAssetState> => {
  try {
    const asset = await api.get<{ s3_url?: unknown }>(
      `/assets/${cloudAssetId}`
    );
    const downloadUrl = asset?.s3_url;
    return typeof downloadUrl === "string" && downloadUrl
      ? { kind: "ready", url: downloadUrl }
      : { kind: "pending" };
  } catch (err) {
    const failure = classifyCloudRequestFailure(err);
    if (failure.kind === "transient") return { kind: "unreachable" };
    return {
      kind: "failed",
      reason: describeRejectedAsset(failure.httpStatus, failure.reason)
    };
  }
};
