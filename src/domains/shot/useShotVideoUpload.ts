import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useMountEffect } from "@hooks/useMountEffect";
import { TrimMetadata } from "@schemas/video";
import { useIsSettingsEditorOpenAtom } from "@store/atoms";
import { getUploadErrorMessage } from "@utils";
import { useSetAtom } from "jotai";
import { ChangeEvent, useRef, useState } from "react";

import { useSelectedProjectId } from "../project/useSelectedProjectId";
import { useIngestVideo } from "../videoUpload/useIngestVideo";

import { useSelectedShot } from "./useSelectedShot";

export const useShotVideoUpload = () => {
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedShot } = useSelectedShot();
  const setIsSettingsEditorOpen = useSetAtom(useIsSettingsEditorOpenAtom());
  const { ingestVideo } = useIngestVideo();

  const [isActiveUpload, setIsActiveUpload] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  useMountEffect(() => {
    return () => abortControllerRef.current?.abort();
  });

  async function handleUpload({
    e,
    trimMetadata,
    processedFile
  }: {
    e: ChangeEvent<HTMLInputElement>;
    trimMetadata?: TrimMetadata;
    processedFile?: File;
  }) {
    setUploadProgress(0);
    setError(undefined);

    const selectedFile = processedFile ?? e.target.files?.[0] ?? null;

    if (!selectedFile) {
      setIsActiveUpload(false);
      return;
    }

    if (isActiveUpload) {
      return;
    }

    if (!selectedShot?.id || !selectedProjectId) {
      return;
    }

    setIsActiveUpload(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await ingestVideo({
        shotId: selectedShot.id,
        projectId: selectedProjectId,
        file: selectedFile,
        trimMetadata,
        signal: abortController.signal,
        onProgress: ({ progress }) => setUploadProgress(progress),
        onUploaded: ({ trackId, trackName }) =>
          trackingUtils.videoActions.upload(
            trackId,
            trackName,
            selectedShot.id,
            selectedShot.user_id || ""
          )
      });

      if (result.outcome === "cancelled") {
        return;
      }

      setIsSettingsEditorOpen(true);
    } catch (err) {
      setError(getUploadErrorMessage(err));
    } finally {
      abortControllerRef.current = null;
      setIsActiveUpload(false);
    }
  }

  return {
    uploadProgress,
    error,
    handleUpload
  };
};
