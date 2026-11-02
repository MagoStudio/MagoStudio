import { usePlaceShotsInFolder } from "@domains/project/shotFolders/usePlaceShotsInFolder";
import { useProject } from "@domains/project/useProject";
import { type BulkUploadFileItem, bulkUploadAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { prepareLocalVideoImport } from "@/platform/prepareLocalVideoImport";
import { queryKeys } from "@/queryKeys";

import { useCloudBulkUpload } from "./useCloudBulkUpload";

const COMPLETE = 100;

const useLocalBulkUpload = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const [bulkUploadState, setBulkUploadState] = useAtom(bulkUploadAtom);
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { placeShotsInFolder } = usePlaceShotsInFolder(projectId);
  const cancelledIds = useRef(new Set<string>());
  const cancelAllRef = useRef(false);
  const activeRef = useRef(false);

  const updateFile = useCallback(
    (fileId: string, updates: Partial<BulkUploadFileItem>) => {
      setBulkUploadState((state) => ({
        ...state,
        files: state.files.map((item) =>
          item.id === fileId ? { ...item, ...updates } : item
        )
      }));
    },
    [setBulkUploadState]
  );

  const startBulkUpload = useCallback(
    async (
      files: File[],
      existingProjectId: string,
      targetFolderId: string
    ) => {
      if (activeRef.current || files.length === 0) return;
      activeRef.current = true;
      cancelAllRef.current = false;
      cancelledIds.current.clear();
      const fileItems: BulkUploadFileItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        status: "pending",
        progress: 0,
        projectId: existingProjectId
      }));
      setBulkUploadState({
        isUploadInProgress: true,
        files: fileItems,
        targetFolderId,
        isPanelVisible: true
      });

      try {
        const imports = [];
        const activeItems = [];
        for (const item of fileItems) {
          if (cancelAllRef.current || cancelledIds.current.has(item.id))
            continue;
          updateFile(item.id, { status: "validating", progress: 10 });
          try {
            imports.push(await prepareLocalVideoImport(item.file));
            activeItems.push(item);
            updateFile(item.id, { status: "uploading", progress: 70 });
          } catch (error) {
            updateFile(item.id, {
              status: "error",
              progress: COMPLETE,
              errorMessage:
                error instanceof Error ? error.message : "Video import failed"
            });
          }
        }

        if (!cancelAllRef.current && imports.length > 0) {
          const created = await window.mago.projects.importVideos({
            projectId: existingProjectId,
            videos: imports
          });
          for (const item of activeItems) {
            updateFile(item.id, { status: "completed", progress: COMPLETE });
          }
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: queryKeys.project.byId(existingProjectId)
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.timelineList.byProjectId(existingProjectId)
            }),
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectList.all
            })
          ]);
          if (targetFolderId) {
            await placeShotsInFolder({
              shotIds: created.map((result) => result.shotId),
              targetFolderId
            });
          }
          showToast({
            message: t("notifications.bulk_upload_complete.description", {
              successCount: activeItems.length,
              totalCount: fileItems.length
            })
          });
        }
      } catch (error) {
        for (const item of fileItems) {
          if (!cancelledIds.current.has(item.id)) {
            updateFile(item.id, {
              status: "error",
              progress: COMPLETE,
              errorMessage:
                error instanceof Error ? error.message : "Video import failed"
            });
          }
        }
      } finally {
        activeRef.current = false;
        setBulkUploadState((state) => ({
          ...state,
          isUploadInProgress: false
        }));
      }
    },
    [
      placeShotsInFolder,
      queryClient,
      setBulkUploadState,
      showToast,
      t,
      updateFile
    ]
  );

  const cancelPendingUpload = useCallback(
    (fileId: string) => {
      cancelledIds.current.add(fileId);
      updateFile(fileId, { status: "cancelled", progress: COMPLETE });
    },
    [updateFile]
  );

  const cancelAllUploads = useCallback(() => {
    cancelAllRef.current = true;
    setBulkUploadState((state) => ({
      ...state,
      files: state.files.map((item) =>
        item.status === "completed" || item.status === "error"
          ? item
          : { ...item, status: "cancelled", progress: COMPLETE }
      )
    }));
  }, [setBulkUploadState]);

  const hideBulkUploadPanel = useCallback(() => {
    setBulkUploadState({
      isUploadInProgress: false,
      files: [],
      targetFolderId: "",
      isPanelVisible: false
    });
  }, [setBulkUploadState]);

  return {
    bulkUploadState,
    startBulkUpload,
    cancelPendingUpload,
    cancelAllUploads,
    hideBulkUploadPanel
  };
};

/** A local project imports files into the library; a cloud project uploads them
 * to cloud Mago exactly as the cloud app does, and is then mirrored back. */
export const useBulkUpload = (projectId: string | undefined) => {
  const local = useLocalBulkUpload(projectId);
  const cloud = useCloudBulkUpload(projectId);
  const { data: project } = useProject(projectId);

  if (project?.origin !== "cloud") return local;
  return {
    bulkUploadState: cloud.bulkUploadState,
    startBulkUpload: cloud.startBulkUpload,
    cancelPendingUpload: cloud.cancelPendingUpload,
    cancelAllUploads: cloud.cancelAllUploads,
    hideBulkUploadPanel: cloud.hideBulkUploadPanel
  };
};
