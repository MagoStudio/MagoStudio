import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useMountEffect } from "@hooks/useMountEffect";
import { TrimMetadata } from "@schemas/video";
import { getUploadErrorMessage } from "@utils";
import { ChangeEvent, useRef, useState } from "react";

import { PROJECT_NAME_MAX_LENGTH } from "../project/constants";
import { fetchProject } from "../project/fetchProject";
import { useAutoNameProjectFromVideo } from "../project/useAutoNameProjectFromVideo";
import { useCreateNewProject } from "../project/useCreateNewProject";
import { useDeleteProject } from "../project/useDeleteProject";
import { useIngestVideo } from "../videoUpload/useIngestVideo";

import { deleteTimeline } from "./api/deleteTimeline";
import { postTimeline } from "./api/postTimeline";
import { putTimeline } from "./api/putTimeline";

interface UseCreateProjectAndUploadVideoParams {
  onSuccess?: (projectId: string, shotId: string) => void;
  existingProjectId?: string;
  parentFolderId?: string;
}

const getTimelineNameFromFile = (file: File) =>
  file.name.replace(/\.[^/.]+$/, "").slice(0, PROJECT_NAME_MAX_LENGTH) ||
  "Untitled";

export const useCreateProjectAndUploadVideo = ({
  onSuccess,
  existingProjectId,
  parentFolderId
}: UseCreateProjectAndUploadVideoParams = {}) => {
  const { createNewProject } = useCreateNewProject();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const { autoNameProjectFromVideo } = useAutoNameProjectFromVideo();
  const { ingestVideo } = useIngestVideo();

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const createdProjectIdRef = useRef<string | null>(null);
  const createdShotIdRef = useRef<string | null>(null);
  const isExistingProjectRef = useRef(false);
  const isNewlyCreatedTimelineRef = useRef(false);

  useMountEffect(() => {
    return () => abortControllerRef.current?.abort();
  });

  const handleUpload = async ({
    e,
    trimMetadata,
    processedFile
  }: {
    e: ChangeEvent<HTMLInputElement>;
    trimMetadata?: TrimMetadata;
    processedFile?: File;
  }) => {
    createdProjectIdRef.current = null;
    createdShotIdRef.current = null;
    isExistingProjectRef.current = false;
    isNewlyCreatedTimelineRef.current = false;
    setUploadProgress(0);
    setError(null);
    setIsUploading(true);

    const selectedFile = processedFile ?? e.target.files?.[0] ?? null;

    if (!selectedFile) {
      setIsUploading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let projectId: string;
      let shotId: string;

      const originalFile = e.target.files?.[0];
      const namingFile = originalFile ?? selectedFile;
      const timelineName = getTimelineNameFromFile(namingFile);

      if (existingProjectId) {
        projectId = existingProjectId;
        createdProjectIdRef.current = projectId;
        isExistingProjectRef.current = true;

        const existingProject = await fetchProject(existingProjectId);
        const emptyTimeline = existingProject?.timelines?.find(
          (timeline) => timeline.layers.length === 0
        );

        if (emptyTimeline) {
          await putTimeline(emptyTimeline.id, {
            name: timelineName,
            settings: {},
            project_id: existingProjectId
          });
          shotId = emptyTimeline.id;
        } else {
          const newTimeline = await postTimeline(
            existingProjectId,
            timelineName
          );
          shotId = newTimeline.id;
          isNewlyCreatedTimelineRef.current = true;
        }
        createdShotIdRef.current = shotId;

        if (existingProject) {
          await autoNameProjectFromVideo(existingProject, namingFile.name);
        }
      } else {
        const newProject = await createNewProject({ parentFolderId });

        if (!newProject) {
          throw new Error("Failed to create project");
        }

        projectId = newProject.id;
        shotId = newProject.timelines?.[0]?.id ?? "";
        createdProjectIdRef.current = projectId;
        createdShotIdRef.current = shotId;

        if (!shotId) {
          throw new Error("No shot found in created project");
        }

        await putTimeline(shotId, {
          name: timelineName,
          settings: {},
          project_id: newProject.id
        });

        await autoNameProjectFromVideo(newProject, namingFile.name);
      }

      const result = await ingestVideo({
        shotId,
        projectId,
        file: selectedFile,
        trimMetadata,
        signal: abortController.signal,
        onProgress: ({ progress }) => setUploadProgress(progress),
        onUploaded: ({ trackId, trackName }) =>
          trackingUtils.videoActions.upload(trackId, trackName, shotId, "")
      });

      if (result.outcome === "cancelled") {
        return;
      }

      onSuccess?.(projectId, shotId);
    } catch (err) {
      console.error("Error in upload flow:", err);

      if (createdProjectIdRef.current && !isExistingProjectRef.current) {
        try {
          await deleteProject({
            projectId: createdProjectIdRef.current
          });
        } catch (deleteError) {
          console.error(
            "Failed to delete project after upload error:",
            deleteError
          );
        }
      }
      setError(getUploadErrorMessage(err));
    } finally {
      abortControllerRef.current = null;
      setIsUploading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setUploadProgress(0);
  };

  const cancelUpload = async () => {
    abortControllerRef.current?.abort();

    if (createdProjectIdRef.current && !isExistingProjectRef.current) {
      try {
        await deleteProject({
          projectId: createdProjectIdRef.current
        });
      } catch {}
    } else if (createdShotIdRef.current && isNewlyCreatedTimelineRef.current) {
      try {
        await deleteTimeline(
          createdShotIdRef.current,
          createdProjectIdRef.current ?? undefined
        );
      } catch {}
    }
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    createdProjectIdRef.current = null;
    createdShotIdRef.current = null;
  };

  return {
    handleUpload,
    uploadProgress,
    error,
    isUploading,
    clearError,
    cancelUpload
  };
};
