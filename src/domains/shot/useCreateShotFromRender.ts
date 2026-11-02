import { downloadTrackVideoForProject } from "@hooks/files/downloadTrackVideoForProject";
import { addVideoRequestAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { buildShotVideoFileFromBlob } from "./utils/buildShotVideoFileFromBlob";

export const useCreateShotFromRender = (projectId: string | undefined) => {
  const { t } = useTranslation();
  const setAddVideoRequest = useSetAtom(addVideoRequestAtom);
  const { showToast } = useToast();
  const [pendingLayerIds, setPendingLayerIds] = useState<Set<string>>(
    new Set()
  );

  const createShotFromRender = async ({
    layerId,
    layerName,
    assetId
  }: {
    layerId: string;
    layerName: string;
    assetId: string | undefined;
  }) => {
    if (!projectId) return;

    setPendingLayerIds((previous) => new Set(previous).add(layerId));
    try {
      const blob = await downloadTrackVideoForProject({
        projectId,
        trackId: layerId,
        assetId
      });
      const file = buildShotVideoFileFromBlob(blob, layerName);
      setAddVideoRequest({ file, existingProjectId: projectId });
    } catch (error) {
      console.error("Failed to create a shot from render:", error);
      showToast({
        message: t(
          "notifications.image_to_video_create_shot_failed.description"
        )
      });
    } finally {
      setPendingLayerIds((previous) => {
        const next = new Set(previous);
        next.delete(layerId);
        return next;
      });
    }
  };

  const isCreatingShotFromLayerId = (layerId: string): boolean =>
    pendingLayerIds.has(layerId);

  return { createShotFromRender, isCreatingShotFromLayerId };
};
