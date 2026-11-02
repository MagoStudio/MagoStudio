import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { LayerType } from "@schemas/layer";
import { useIsSettingsEditorOpenAtom } from "@store/atoms";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { usePostTrack } from "@/domains/track/data/usePostTrack";
import { videoRenderTarget } from "@/platform/renderTarget";
import { queryKeys } from "@/queryKeys";

import { useProject } from "../project/useProject";

import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";
import { useInputTrack } from "./useInputTrack";
import { useSetSelectedTrackIds } from "./useSetSelectedTrackIds";
import { computeTrackName } from "./utils/computeTrackName";

const STATE_SYNC_DELAY = 300;

export const useAddTrack = () => {
  const setSelectedTrackIds = useSetSelectedTrackIds();
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);
  const queryClient = useQueryClient();
  const { selectedShotId } = useSelectedShotId();

  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();

  const { mutateAsync: addTrackMutation, isPending } = usePostTrack({
    selectedProjectId,
    parentVideoTrackId: videoTrack?.id
  });

  const setIsTrackSettingsDrawerOpen = useSetAtom(
    useIsSettingsEditorOpenAtom()
  );
  const { inputTrack } = useInputTrack();
  const { selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const addTrack = async (options?: {
    parentTrackOrder?: number;
    shotIdOverride?: string;
    shotNameWhenMissingFromCache?: string;
  }) => {
    const targetShotId = options?.shotIdOverride ?? selectedShotId;
    if (!targetShotId || !selectedProjectId || !selectedProject) return;

    const isWritingToSelectedShot = targetShotId === selectedShotId;

    const targetShot = selectedProject.timelines?.find(
      (shot) => shot.id === targetShotId
    );

    const defaultName =
      targetShot?.name ??
      options?.shotNameWhenMissingFromCache ??
      selectedProject.name;
    const sourceTrackName = isWritingToSelectedShot
      ? (inputTrack ?? videoTrack)?.name
      : undefined;
    const existingTrackNames = isWritingToSelectedShot
      ? tracks.map((track) => track.name)
      : (targetShot?.layers ?? []).map((layer) => layer.name);

    const trackName = sourceTrackName
      ? computeTrackName({
          sourceTrackName,
          modelEngine: selectedModel.name,
          existingTrackNames,
          defaultName
        })
      : defaultName;

    const isOutputOfLocalProviderRender =
      videoRenderTarget(selectedModel.name) === "local";
    const newTrack = await addTrackMutation({
      shotId: targetShotId,
      trackType: LayerType.RENDER,
      trackName,
      data: { renderEngine: "magov2" },
      parentTrackOrder: options?.parentTrackOrder ?? 1,
      isOutputOfLocalProviderRender
    });

    trackingUtils.trackActions.create(
      newTrack.id,
      newTrack.timeline_id,
      newTrack.user_id
    );

    if (isWritingToSelectedShot) {
      setSelectedTrackIds([newTrack.id]);
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.project.byId(selectedProjectId)
    });

    await new Promise((resolve) => setTimeout(resolve, STATE_SYNC_DELAY));

    if (isWritingToSelectedShot) {
      setIsTrackSettingsDrawerOpen(true);
    }

    return newTrack;
  };
  return {
    addTrack,
    isPending
  };
};
