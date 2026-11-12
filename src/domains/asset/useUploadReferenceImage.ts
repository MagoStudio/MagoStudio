import { useIsReferenceImageUploading } from "@context/IsReferenceImageUploading";
import { ImageAssetResponse } from "@domains/asset/api/interface";
import { useQueryClient } from "@tanstack/react-query";
import { getImageDimensions } from "@utils";
import { resizeImageFromFile } from "@utils/image/resizeImage";
import { useRef, useState } from "react";

import { getLocalDesktopApi } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

const THUMBNAIL_MAX_SIDE_PX = 1024;
const THUMBNAIL_JPEG_QUALITY = 0.85;
const INITIAL_PROGRESS = 5;
const COMPLETE_PROGRESS = 100;
const PROGRESS_RESET_DELAY_MS = 300;

const createAbortError = () => new DOMException("Upload aborted", "AbortError");

/**
 * The cloud hook's interface (cancellable, progress-reporting, several uploads
 * at once; `selectedLayerId` is accepted and unused), with the upload replaced: the image is imported into the
 * local library from its path on disk instead of being put to S3.
 */
export const useUploadReferenceImage = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isReferenceImageUploading, setIsReferenceImageUploading } =
    useIsReferenceImageUploading();
  const inFlightUploadCountRef = useRef(0);

  const uploadReferenceImage = async ({
    file,
    projectId,
    signal,
    onProgress,
    onError
  }: {
    file: File;
    selectedLayerId?: string;
    projectId?: string;
    signal?: AbortSignal;
    onProgress?: (progress: number) => void;
    onError?: (error: unknown) => void;
  }): Promise<string | undefined> => {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const reportProgress = (progress: number) => {
      setUploadProgress(progress);
      onProgress?.(progress);
    };

    inFlightUploadCountRef.current += 1;
    setIsReferenceImageUploading(true);
    reportProgress(0);
    try {
      const dimensions = await getImageDimensions(file);
      reportProgress(INITIAL_PROGRESS);

      const sourcePath = getLocalDesktopApi().files.getPath(file);
      if (!sourcePath) {
        throw new Error("upload_button_file_access_error");
      }
      const thumbnail = await resizeImageFromFile(file, {
        maxWidth: THUMBNAIL_MAX_SIDE_PX,
        maxHeight: THUMBNAIL_MAX_SIDE_PX,
        imageFormat: "image/jpeg",
        imageQuality: THUMBNAIL_JPEG_QUALITY,
        showTransparencyAsCheckerboard: true
      });
      const thumbnailDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () =>
          reject(new Error("Unable to read image thumbnail"));
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to read image thumbnail"));
            return;
          }
          resolve(reader.result);
        };
        reader.readAsDataURL(thumbnail);
      });
      // The import is one local call with nothing to roll back, so a
      // cancellation is honoured up to the point it starts.
      if (signal?.aborted) throw createAbortError();

      const asset = await getLocalDesktopApi().assets.importImage({
        projectId,
        sourcePath,
        name: file.name,
        width: dimensions.width,
        height: dimensions.height,
        thumbnailDataUrl
      });
      queryClient.setQueryData<ImageAssetResponse>(
        queryKeys.imageAsset.byId(asset.id),
        {
          s3_url: asset.filepath,
          urlToUse: URL.createObjectURL(file),
          asset: asset as ImageAssetResponse["asset"]
        }
      );

      reportProgress(COMPLETE_PROGRESS);
      setTimeout(() => setUploadProgress(0), PROGRESS_RESET_DELAY_MS);
      return asset.id;
    } catch (caughtError) {
      console.error(caughtError);
      setError(caughtError as Error);
      reportProgress(0);
      onError?.(caughtError);
      throw caughtError;
    } finally {
      inFlightUploadCountRef.current -= 1;
      if (inFlightUploadCountRef.current === 0) {
        setIsReferenceImageUploading(false);
      }
    }
  };

  return {
    mutateAsync: uploadReferenceImage,
    isPending: isReferenceImageUploading,
    uploadProgress,
    error
  };
};
