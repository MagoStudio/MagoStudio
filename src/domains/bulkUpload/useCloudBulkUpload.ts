import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useLatestRef } from "@hooks/useLatestRef";
import { type BulkUploadFileItem, bulkUploadAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { getUploadErrorMessage } from "@utils";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { fetchProject } from "../project/fetchProject";
import { type ShotFolderOrShot } from "../project/shotFolders/interface";
import { useProjectShotFolders } from "../project/shotFolders/useProjectShotFolders";
import { useUpdateProjectShotFolders } from "../project/shotFolders/useUpdateProjectShotFolders";
import { useAutoNameProjectFromVideo } from "../project/useAutoNameProjectFromVideo";
import { deleteTimeline } from "../shot/deleteTimeline";
import { postTimeline } from "../shot/postTimeline";
import { putTimeline } from "../shot/putTimeline";
import { UPLOAD_PROGRESS_COMPLETE } from "../videoUpload/constants";
import { IngestPhase } from "../videoUpload/types";
import { useIngestVideo } from "../videoUpload/useIngestVideo";

import { validateVideoFile } from "./utils/getVideoDuration";

const INITIAL_UPLOAD_PROGRESS = 5;

const STATUS_BY_INGEST_PHASE: Partial<
  Record<IngestPhase, BulkUploadFileItem["status"]>
> = {
  uploading: "uploading",
  ingesting: "ingesting",
  finalizing: "completed"
};

export const useCloudBulkUpload = (projectId: string | undefined) => {
  const { ingestVideo } = useIngestVideo();
  const { data: shotFoldersData } = useProjectShotFolders(projectId);
  const { mutateAsync: updateShotFolders } =
    useUpdateProjectShotFolders(projectId);
  const { autoNameProjectFromVideo } = useAutoNameProjectFromVideo();

  const [bulkUploadState, setBulkUploadState] = useAtom(bulkUploadAtom);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const bulkUploadStateRef = useLatestRef(bulkUploadState);

  const shotFoldersRef = useLatestRef(shotFoldersData);

  const workingFoldersRef = useRef<ShotFolderOrShot[]>([]);
  const isUploadInProgressRef = useRef(false);
  const isCancelAllRequestedRef = useRef(false);
  const abortControllersRef = useRef(new Map<string, AbortController>());

  const updateFileStatus = (
    fileId: string,
    updates: Partial<
      Pick<
        BulkUploadFileItem,
        "status" | "progress" | "errorMessage" | "projectId"
      >
    >
  ) => {
    setBulkUploadState((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.id === fileId
          ? {
              ...f,
              ...updates
            }
          : f
      )
    }));
  };

  const cleanupTimeline = async (
    timelineId: string | null,
    timelineProjectId: string
  ) => {
    if (!timelineId) return;
    try {
      await deleteTimeline(timelineId, timelineProjectId);
    } catch (e) {
      console.error("Failed to delete timeline:", e);
    }
  };

  const isFileCancelled = (fileId: string): boolean => {
    const file = bulkUploadStateRef.current.files.find((f) => f.id === fileId);
    return file?.status === "cancelled";
  };

  const checkCancelled = async (
    timelineId: string | null,
    timelineProjectId: string,
    fileId?: string
  ): Promise<boolean> => {
    if (fileId && isFileCancelled(fileId)) {
      await cleanupTimeline(timelineId, timelineProjectId);
      return true;
    }
    if (!isCancelAllRequestedRef.current) return false;
    await cleanupTimeline(timelineId, timelineProjectId);
    return true;
  };

  const processFile = async (
    fileItem: BulkUploadFileItem,
    existingProjectId: string,
    targetFolderId: string,
    totalCount: number,
    emptyTimelineId?: string
  ) => {
    let createdTimelineId: string | null = null;
    let isReusedTimeline = false;

    const abortController = new AbortController();
    abortControllersRef.current.set(fileItem.id, abortController);

    try {
      updateFileStatus(fileItem.id, {
        status: "validating",
        progress: 0
      });
      const validationError = await validateVideoFile(fileItem.file);
      if (validationError) {
        updateFileStatus(fileItem.id, {
          status: "error",
          errorMessage: t(validationError)
        });
        return "error";
      }
      updateFileStatus(fileItem.id, {
        status: "uploading",
        progress: 0
      });
      if (await checkCancelled(null, existingProjectId, fileItem.id))
        return "cancelled";

      const timelineName = fileItem.fileName.replace(/\.[^/.]+$/, "");
      let shotId: string;

      if (emptyTimelineId) {
        await putTimeline(emptyTimelineId, {
          name: timelineName,
          settings: {},
          project_id: existingProjectId
        });
        shotId = emptyTimelineId;
        isReusedTimeline = true;
      } else {
        const newTimeline = await postTimeline(existingProjectId, timelineName);
        if (!newTimeline) throw new Error("Failed to create timeline");
        shotId = newTimeline.id;
      }

      createdTimelineId = shotId;

      const newShotEntry: ShotFolderOrShot = {
        id: shotId,
        name: timelineName,
        parentFolderId: targetFolderId,
        type: "shot",
        createdAt: dayjs().unix()
      };
      const updatedWithShot = [...workingFoldersRef.current, newShotEntry];
      workingFoldersRef.current = updatedWithShot;
      await updateShotFolders(updatedWithShot);

      updateFileStatus(fileItem.id, {
        projectId: existingProjectId,
        progress: INITIAL_UPLOAD_PROGRESS
      });

      const cleanupId = isReusedTimeline ? null : createdTimelineId;

      if (await checkCancelled(cleanupId, existingProjectId, fileItem.id))
        return "cancelled";

      const result = await ingestVideo({
        shotId,
        projectId: existingProjectId,
        file: fileItem.file,
        signal: abortController.signal,
        awaitInvalidation: false,
        onProgress: ({ phase, progress }) => {
          const status = STATUS_BY_INGEST_PHASE[phase];
          updateFileStatus(fileItem.id, {
            progress,
            ...(status ? { status } : {})
          });
        },
        onUploaded: ({ trackId, trackName }) =>
          trackingUtils.videoActions.upload(trackId, trackName, shotId, "", {
            numberOfVideos: totalCount,
            videoFormats: [
              fileItem.file.type || fileItem.fileName.split(".").pop() || ""
            ]
          })
      });

      if (result.outcome === "cancelled") {
        await cleanupTimeline(cleanupId, existingProjectId);
        return "cancelled";
      }

      updateFileStatus(fileItem.id, {
        status: "completed",
        progress: UPLOAD_PROGRESS_COMPLETE
      });

      return "completed";
    } catch (err) {
      if (!isReusedTimeline) {
        await cleanupTimeline(createdTimelineId, existingProjectId);
      }

      const errorKey = getUploadErrorMessage(err);
      updateFileStatus(fileItem.id, {
        status: "error",
        errorMessage: errorKey.startsWith("upload_button_")
          ? t(`notifications.${errorKey}.description`)
          : t(errorKey)
      });

      return "error";
    } finally {
      abortControllersRef.current.delete(fileItem.id);
    }
  };

  const startBulkUpload = async (
    files: File[],
    existingProjectId: string,
    targetFolderId: string
  ) => {
    if (isUploadInProgressRef.current) return;
    isUploadInProgressRef.current = true;

    try {
      isCancelAllRequestedRef.current = false;

      workingFoldersRef.current =
        shotFoldersRef.current?.shotFoldersAndShots || [];

      const fileItems: BulkUploadFileItem[] = files.map((file, index) => ({
        id: `bulk-${Date.now()}-${index}`,
        file,
        fileName: file.name,
        status: "pending" as const,
        progress: 0
      }));

      setBulkUploadState({
        isUploadInProgress: true,
        files: fileItems,
        targetFolderId,
        isPanelVisible: true
      });

      const existingProject = await fetchProject(existingProjectId);
      const emptyTimelineId = existingProject?.timelines?.find(
        (timeline) => timeline.layers.length === 0
      )?.id;

      if (existingProject && files.length > 0) {
        await autoNameProjectFromVideo(existingProject, files[0].name);
      }

      let successCount = 0;
      let errorCount = 0;
      let cancelledCount = 0;

      for (let i = 0; i < fileItems.length; i++) {
        const fileItem = fileItems[i];
        if (isCancelAllRequestedRef.current) {
          cancelledCount++;
          continue;
        }

        const currentState = bulkUploadStateRef.current;
        const currentFile = currentState.files.find(
          (f) => f.id === fileItem.id
        );
        if (currentFile?.status === "cancelled") {
          cancelledCount++;
          continue;
        }

        const result = await processFile(
          fileItem,
          existingProjectId,
          targetFolderId,
          fileItems.length,
          i === 0 ? emptyTimelineId : undefined
        );

        if (result === "completed") successCount++;
        else if (result === "error") errorCount++;
        else if (result === "cancelled") cancelledCount++;
      }

      const totalCount = fileItems.length;
      const hasErrors = errorCount > 0;
      const allCancelled = cancelledCount === totalCount;

      if (!allCancelled) {
        const toastMessage = hasErrors
          ? t("notifications.bulk_upload_complete_with_errors.description", {
              successCount,
              totalCount
            })
          : t("notifications.bulk_upload_complete.description", {
              successCount,
              totalCount
            });
        showToast({
          message: toastMessage
        });
      }
    } finally {
      isUploadInProgressRef.current = false;
      setBulkUploadState((prev) => ({
        ...prev,
        isUploadInProgress: false
      }));
    }
  };

  const cancelPendingUpload = (fileId: string) => {
    updateFileStatus(fileId, {
      status: "cancelled"
    });
    abortControllersRef.current.get(fileId)?.abort();
  };

  const cancelAllUploads = () => {
    isCancelAllRequestedRef.current = true;
    abortControllersRef.current.forEach((controller) => controller.abort());
    setBulkUploadState((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.status === "pending" ||
        f.status === "uploading" ||
        f.status === "ingesting" ||
        f.status === "validating"
          ? {
              ...f,
              status: "cancelled" as const
            }
          : f
      )
    }));
  };

  const hideBulkUploadPanel = () => {
    setBulkUploadState({
      isUploadInProgress: false,
      files: [],
      targetFolderId: "",
      isPanelVisible: false
    });
  };

  return {
    bulkUploadState,
    startBulkUpload,
    cancelPendingUpload,
    cancelAllUploads,
    hideBulkUploadPanel
  };
};
