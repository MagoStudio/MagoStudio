"use client";

import { ROUTES } from "@config/constants";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { isMaskTrack } from "@domains/track/utils/isMaskTrack";
import {
  GLOBAL_TIMELINE_TAB_ID,
  PLAN_TAB_ID
} from "@home/components/projectModeTabs";
import { type Tool, TOOL_URL_PARAM } from "@hooks/tool/useTool";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useShallowRouter } from "@hooks/useShallowRouter";
import {
  isPlayingAtom,
  useIsSettingsEditorOpenAtom,
  useInputTrackIdAtom
} from "@store/atoms";
import { useSetAtom, useStore } from "jotai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useProjectModeNavigation = () => {
  const router = useRouter();
  const { replace: shallowReplace } = useShallowRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setIsSettingsEditorOpen = useSetAtom(useIsSettingsEditorOpenAtom());
  const selectedTrackIds = useSelectedTrackIds();
  const inputTrackIdAtom = useInputTrackIdAtom();
  // Read imperatively inside handleTabChange instead of useAtomValue: this
  // value is only needed in that click handler, never in render output, and
  // subscribing here would re-render every page that calls this hook (e.g.
  // Plan, Project Timeline) whenever inputTrackIdAtom changes in another tab.
  const jotaiStore = useStore();
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();

  const isProjectTimelinePage = pathname?.startsWith(ROUTES.PROJECT_TIMELINE);
  const isPlanPage = pathname?.startsWith(ROUTES.PLAN);

  const hasSelectionHiddenInMode = (mode: Tool) => {
    const selectedRenderTracks = tracks.filter((track) =>
      selectedTrackIds.includes(track.id)
    );
    return selectedRenderTracks.some((track) =>
      mode === "mask" ? !isMaskTrack(track) : isMaskTrack(track)
    );
  };

  const buildSharedParams = (selectedTrackIdsOverride?: string) => {
    const projectId = searchParams.get("projectId");
    const timelineId = searchParams.get("timelineId");
    const trackIdsParam =
      selectedTrackIdsOverride ?? searchParams.get("selectedTrackIds");
    return [
      projectId && `projectId=${projectId}`,
      timelineId && `timelineId=${timelineId}`,
      trackIdsParam && `selectedTrackIds=${trackIdsParam}`
    ]
      .filter(Boolean)
      .join("&");
  };

  const handleTabChange = (key: string) => {
    trackingUtils.projectModeActions.tabChange(key);
    setIsPlaying(false);

    if (key === GLOBAL_TIMELINE_TAB_ID) {
      if (!isProjectTimelinePage) {
        const params = buildSharedParams();
        router.push(`${ROUTES.PROJECT_TIMELINE}?${params}`);
      }
      return;
    }

    if (key === PLAN_TAB_ID) {
      if (!isPlanPage) {
        const params = buildSharedParams();
        router.push(`${ROUTES.PLAN}?${params}`);
      }
      return;
    }

    const tool = key as Tool;

    if (tool === "render-video" || tool === "upscale" || tool === "mask") {
      // Reopen the settings side panel on tool change — entering SBS/TWO/FOUR
      // view closes it (see PreviewButtonGroup.handleViewModeChange), and it
      // would otherwise stay closed after switching tools.
      setIsSettingsEditorOpen(true);
    }

    const inputTrackId = jotaiStore.get(inputTrackIdAtom);
    const shouldResetSelection =
      videoTrack !== undefined && hasSelectionHiddenInMode(tool);
    const resolvedInputTrack = tracks.find(
      (track) => track.id === inputTrackId
    );
    const isInputTrackAMaskTrack =
      resolvedInputTrack !== undefined && isMaskTrack(resolvedInputTrack);
    const resetTrackId =
      inputTrackId && !isInputTrackAMaskTrack ? inputTrackId : videoTrack?.id;

    if (isProjectTimelinePage || isPlanPage) {
      const params = buildSharedParams(
        shouldResetSelection ? resetTrackId : undefined
      );
      const separator = params ? "&" : "";
      router.push(`${ROUTES.PROJECT}?${params}${separator}tool=${tool}`);
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (shouldResetSelection) {
      nextParams.set("selectedTrackIds", resetTrackId);
    }
    nextParams.set(TOOL_URL_PARAM, tool);
    shallowReplace(`${pathname}?${nextParams.toString()}`);
  };

  return { handleTabChange };
};
