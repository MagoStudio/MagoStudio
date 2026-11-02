import {
  BulkRendersRunDraftMasterSettings,
  BulkRenderingDraftShotImageSettingPatch,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotImageSettingOverrides } from "./utils/buildBulkRenderingDraftShotImageSettingOverrides";

type BulkRenderingDraftShotImageSettingKey =
  keyof BulkRenderingDraftShotImageSettingPatch;

export interface BulkRenderingDraftShotImageSettingsState {
  getImageSetting: <K extends BulkRenderingDraftShotImageSettingKey>(
    shotId: string,
    key: K
  ) => BulkRenderingDraftShotImageSettingPatch[K];
  getShotOwnImageSettingWithoutMasterFallback: <
    K extends BulkRenderingDraftShotImageSettingKey
  >(
    shotId: string,
    key: K
  ) => BulkRenderingDraftShotImageSettingPatch[K];
  setImageSetting: <K extends BulkRenderingDraftShotImageSettingKey>(
    shotId: string,
    key: K,
    value: BulkRenderingDraftShotImageSettingPatch[K]
  ) => void;
  hasAnyShotImageSettingOverride: boolean;
  shotImageSettingOverrideById: Record<
    string,
    BulkRenderingDraftShotImageSettingPatch
  >;
}

export const useBulkRenderingDraftShotImageSettings = ({
  masterSettings,
  imageSettingByShotId
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  imageSettingByShotId: Record<string, BulkRenderingDraftShotImageSettingPatch>;
}): BulkRenderingDraftShotImageSettingsState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const masterImageSettingPatch =
    masterSettings.imageSettings as unknown as BulkRenderingDraftShotImageSettingPatch;

  const getImageSetting = <K extends BulkRenderingDraftShotImageSettingKey>(
    shotId: string,
    key: K
  ): BulkRenderingDraftShotImageSettingPatch[K] =>
    imageSettingByShotId[shotId]?.[key] ?? masterImageSettingPatch[key];

  const getShotOwnImageSettingWithoutMasterFallback = <
    K extends BulkRenderingDraftShotImageSettingKey
  >(
    shotId: string,
    key: K
  ): BulkRenderingDraftShotImageSettingPatch[K] =>
    imageSettingByShotId[shotId]?.[key];

  const setImageSetting = <K extends BulkRenderingDraftShotImageSettingKey>(
    shotId: string,
    key: K,
    value: BulkRenderingDraftShotImageSettingPatch[K]
  ) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        imageSettingByShotId: {
          ...currentFlow.imageSettingByShotId,
          [shotId]: {
            ...currentFlow.imageSettingByShotId[shotId],
            [key]: value
          }
        }
      };
    });

  const shotImageSettingOverrideById =
    buildBulkRenderingDraftShotImageSettingOverrides({
      imageSettingByShotId
    });

  return {
    getImageSetting,
    getShotOwnImageSettingWithoutMasterFallback,
    setImageSetting,
    hasAnyShotImageSettingOverride:
      Object.keys(shotImageSettingOverrideById).length > 0,
    shotImageSettingOverrideById
  };
};
