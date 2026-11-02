import { useImageAssets } from "@domains/asset/useImageAssets";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { getImageDimensions } from "@utils";
import {
  getImageLimitErrorKey,
  IMAGE_UPLOAD_LIMITS
} from "@utils/image/imageUploadLimits";
import { useState } from "react";

export interface PlanShotImageUpload {
  id: string;
  fileName: string;
  status: "uploading" | "done" | "error";
  assetId?: string;
  errorKey?: string;
}

interface UsePlanShotImageAssignmentsArgs {
  initialManualOverrides?: Record<string, string>;
}

export const usePlanShotImageAssignments = ({
  initialManualOverrides
}: UsePlanShotImageAssignmentsArgs = {}) => {
  const [uploads, setUploads] = useState<PlanShotImageUpload[]>([]);
  const [manualOverrides, setManualOverrides] = useState<
    Record<string, string | null>
  >(() => initialManualOverrides ?? {});
  const { mutateAsync: uploadReferenceImage } = useUploadReferenceImage();

  const manualOverrideOnlyAssetIds = Array.from(
    new Set(
      Object.values(manualOverrides).filter(
        (assetId): assetId is string => !!assetId
      )
    )
  ).filter((assetId) => !uploads.some((upload) => upload.assetId === assetId));
  const { data: manualOverrideAssets } = useImageAssets({
    assetIds: manualOverrideOnlyAssetIds
  });
  const manualOverrideUploads: PlanShotImageUpload[] =
    manualOverrideOnlyAssetIds.map((assetId) => ({
      id: assetId,
      fileName:
        manualOverrideAssets.find((asset) => asset.asset.id === assetId)?.asset
          .name ?? assetId,
      status: "done",
      assetId
    }));

  const uploadOneFile = async (file: File, projectId: string) => {
    const id = crypto.randomUUID();
    setUploads((prev) => [
      ...prev,
      { id, fileName: file.name, status: "uploading" }
    ]);

    let errorKey: string | undefined;
    try {
      const dimensions = await getImageDimensions(file);
      errorKey =
        getImageLimitErrorKey(file, dimensions, IMAGE_UPLOAD_LIMITS) ??
        undefined;
    } catch {
      errorKey = "upload_button_file_read_error";
    }

    if (errorKey) {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, status: "error", errorKey } : upload
        )
      );
      return;
    }

    try {
      const assetId = await uploadReferenceImage({ file, projectId });
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id
            ? assetId
              ? { ...upload, status: "done", assetId }
              : { ...upload, status: "error", errorKey: "upload_error" }
            : upload
        )
      );
    } catch {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id
            ? { ...upload, status: "error", errorKey: "upload_error" }
            : upload
        )
      );
    }
  };

  const uploadFiles = async (files: File[], projectId: string) => {
    await Promise.all(files.map((file) => uploadOneFile(file, projectId)));
  };

  const removeUpload = (id: string) => {
    const isRealUpload = uploads.some((upload) => upload.id === id);
    if (isRealUpload) {
      setUploads((prev) => prev.filter((upload) => upload.id !== id));
      return;
    }
    setManualOverrides((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([shotId, assetId]) => [
          shotId,
          assetId === id ? null : assetId
        ])
      )
    );
  };

  const setManualOverride = (shotId: string, assetId: string | null) => {
    setManualOverrides((prev) => ({ ...prev, [shotId]: assetId }));
  };

  return {
    uploads: [...uploads, ...manualOverrideUploads],
    manualOverrides,
    uploadFiles,
    removeUpload,
    setManualOverride
  };
};
