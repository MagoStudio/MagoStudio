import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { GptImage2Quality } from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import { Nanobanana2Resolution } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";
import {
  BulkRendersRunDraftMasterSettings,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotImageSettings } from "./utils/buildBulkRenderingDraftShotImageSettings";
import { buildBulkRenderingDraftShotImageSettingsOverrides } from "./utils/buildBulkRenderingDraftShotImageSettingsOverrides";
import { getBulkRenderingImageSettingKeyForModel } from "./utils/getBulkRenderingImageSettingKeyForModel";

export type BulkRenderingDraftImageModel = Img2ImgType["model"];
type BulkRenderingImageSettingValue =
  | GptImage2Quality
  | Nanobanana2Resolution
  | number;

export interface BulkRenderingDraftShotImageModelsState {
  defaultImageModel: BulkRenderingDraftImageModel;
  getImageModel: (shotId: string) => BulkRenderingDraftImageModel;
  setImageModel: (
    shotId: string,
    imageModel: BulkRenderingDraftImageModel
  ) => void;
  imageSettingsByShotId: Record<string, Img2ImgType>;
  imageSettingsOverrideByShotId: Record<string, Img2ImgType>;
  hasAnyShotImageModelOverride: boolean;
}

export const useBulkRenderingDraftShotImageModels = ({
  masterSettings,
  imageModelByShotId,
  shotIds,
  getShotPrompt,
  getShotReferenceAssetIds,
  getShotOwnImageSettingWithoutMasterFallback
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  imageModelByShotId: Record<string, BulkRenderingDraftImageModel>;
  shotIds: string[];
  getShotPrompt: (shotId: string) => string;
  getShotReferenceAssetIds: (shotId: string) => string[];
  getShotOwnImageSettingWithoutMasterFallback: (
    shotId: string,
    imageSettingKey: "quality" | "resolution"
  ) => BulkRenderingImageSettingValue | undefined;
}): BulkRenderingDraftShotImageModelsState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const defaultImageModel = masterSettings.imageSettings.model;

  const getImageModel = (shotId: string) =>
    imageModelByShotId[shotId] ?? defaultImageModel;

  const setImageModel = (
    shotId: string,
    imageModel: BulkRenderingDraftImageModel
  ) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        imageModelByShotId: {
          ...currentFlow.imageModelByShotId,
          [shotId]: imageModel
        }
      };
    });

  const imageSettingKeyByShotId = Object.fromEntries(
    shotIds.map((shotId) => [
      shotId,
      getBulkRenderingImageSettingKeyForModel(getImageModel(shotId))
    ])
  );

  const imageSettingsByShotId = Object.fromEntries(
    shotIds.map((shotId) => {
      const shotImageSettingKey = imageSettingKeyByShotId[shotId];
      return [
        shotId,
        buildBulkRenderingDraftShotImageSettings({
          masterImageSettings: masterSettings.imageSettings,
          shotImageModel: getImageModel(shotId),
          shotPrompt: getShotPrompt(shotId),
          shotReferenceAssetIds: getShotReferenceAssetIds(shotId),
          shotImageSettingKey,
          shotImageSettingValue: shotImageSettingKey
            ? getShotOwnImageSettingWithoutMasterFallback(
                shotId,
                shotImageSettingKey
              )
            : undefined
        })
      ];
    })
  );

  const hasShotImageSettingOverrideById = Object.fromEntries(
    shotIds.map((shotId) => {
      const shotImageSettingKey = imageSettingKeyByShotId[shotId];
      return [
        shotId,
        shotImageSettingKey !== undefined &&
          getShotOwnImageSettingWithoutMasterFallback(
            shotId,
            shotImageSettingKey
          ) !== undefined
      ];
    })
  );

  const imageSettingsOverrideByShotId =
    buildBulkRenderingDraftShotImageSettingsOverrides({
      imageSettingsByShotId,
      defaultImageModel,
      hasShotImageSettingOverrideById
    });

  return {
    defaultImageModel,
    getImageModel,
    setImageModel,
    imageSettingsByShotId,
    imageSettingsOverrideByShotId,
    hasAnyShotImageModelOverride:
      Object.keys(imageSettingsOverrideByShotId).length > 0
  };
};
