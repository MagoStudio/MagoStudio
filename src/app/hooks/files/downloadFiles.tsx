import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
import { Layer } from "@schemas/layer";
import { AxiosError } from "axios";

import { backendApiClient } from "@/lib/backend-api-client";

const HTTP_STATUS_NOT_FOUND = 404;

export type LayerDownloadKind = "frames" | "assets" | "video" | "exr";

const isNotFoundError = (error: unknown): boolean =>
  error instanceof AxiosError &&
  error.response?.status === HTTP_STATUS_NOT_FOUND;

export const getLayerDownloadSignedUrl = async ({
  layerId,
  kind
}: {
  layerId: Layer["id"];
  kind: LayerDownloadKind;
}): Promise<string> => {
  try {
    const response = await backendApiClient.get<{ url?: string }>(
      `/download/${kind}/layer/${layerId}`
    );
    const signedUrl = response.data?.url;
    if (!signedUrl) throw new Error("File not found");
    return signedUrl;
  } catch (error) {
    if (isNotFoundError(error)) throw new Error("File not found");
    throw error;
  }
};

const downloadLayerBlob = async (
  layerId: Layer["id"],
  kind: LayerDownloadKind
): Promise<Blob> => {
  const signedUrl = await getLayerDownloadSignedUrl({ layerId, kind });
  const response = await fetch(toDesktopCloudStorageUrl(signedUrl));
  if (response.status === HTTP_STATUS_NOT_FOUND) {
    throw new Error("File not found");
  }
  if (!response.ok) {
    throw new Error(`The download failed (HTTP ${response.status})`);
  }
  return response.blob();
};

export const downloadLayerFrames = async ({
  layerId
}: {
  layerId: Layer["id"];
}): Promise<Blob> => downloadLayerBlob(layerId, "frames");

export const downloadLayerVideoAndFrames = async ({
  layerId
}: {
  layerId: Layer["id"];
}): Promise<Blob> => downloadLayerBlob(layerId, "assets");

export const downloadLayerVideo = async ({
  layerId
}: {
  layerId: Layer["id"];
}): Promise<Blob> => downloadLayerBlob(layerId, "video");

export const downloadLayerEXR = async ({
  layerId
}: {
  layerId: Layer["id"];
}): Promise<Blob> => downloadLayerBlob(layerId, "exr");
