import { VideoSettings } from "@models/video/types";
import {
  BulkRendersRunDraftMasterSettings,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotVideoSettingsOverrides } from "./utils/buildBulkRenderingDraftShotVideoSettingsOverrides";

export interface BulkRenderingDraftShotVideoSettingsState {
  getVideoSetting: <K extends keyof VideoSettings>(
    shotId: string,
    key: K
  ) => VideoSettings[K];
  setVideoSetting: <K extends keyof VideoSettings>(
    shotId: string,
    key: K,
    value: VideoSettings[K]
  ) => void;
  hasAnyShotVideoSettingsOverride: boolean;
  shotVideoSettingsOverrideById: Record<string, Partial<VideoSettings>>;
}

export const useBulkRenderingDraftShotVideoSettings = ({
  masterSettings,
  videoSettingsByShotId
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  videoSettingsByShotId: Record<string, Partial<VideoSettings>>;
}): BulkRenderingDraftShotVideoSettingsState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const getVideoSetting = <K extends keyof VideoSettings>(
    shotId: string,
    key: K
  ): VideoSettings[K] =>
    (videoSettingsByShotId[shotId]?.[key] ??
      masterSettings.videoSettings[key]) as VideoSettings[K];

  const setVideoSetting = <K extends keyof VideoSettings>(
    shotId: string,
    key: K,
    value: VideoSettings[K]
  ) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        videoSettingsByShotId: {
          ...currentFlow.videoSettingsByShotId,
          [shotId]: {
            ...currentFlow.videoSettingsByShotId[shotId],
            [key]: value
          }
        }
      };
    });

  const shotVideoSettingsOverrideById =
    buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId,
      getShotCurrentVideoModelDefinition: () => masterSettings.videoModel
    });

  return {
    getVideoSetting,
    setVideoSetting,
    hasAnyShotVideoSettingsOverride:
      Object.keys(shotVideoSettingsOverrideById).length > 0,
    shotVideoSettingsOverrideById
  };
};
