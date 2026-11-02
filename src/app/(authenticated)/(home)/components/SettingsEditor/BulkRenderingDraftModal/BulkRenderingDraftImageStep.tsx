import { MainButton } from "@components/MainButton";
import {
  BulkRenderingDraftImageModel,
  BulkRenderingDraftShotImageModelsState
} from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageModels";
import { BulkRenderingDraftShotImageReferencesState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageReferences";
import { BulkRenderingDraftShotImageSettingsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageSettings";
import { BulkRenderingDraftShotImageSourceFramesState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageSourceFrames";
import { BulkRenderingDraftShotPromptsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotPrompts";
import { getBulkRenderingImageSettingKeyForModel } from "@domains/bulkRendersRun/utils/getBulkRenderingImageSettingKeyForModel";
import { GptImage2Quality } from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import { Nanobanana2Resolution } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";
import { Layer } from "@schemas/layer";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftImageShotCard } from "./BulkRenderingDraftImageShotCard";
import {
  FOOTER_BUTTON_WIDTH_CLASS,
  SCROLLBAR_COMPENSATED_RIGHT_PADDING_CLASS,
  SHOT_CARD_GRID_COLUMNS_CLASS
} from "./bulkRenderingDraftLayout";

export function BulkRenderingDraftImageStep({
  shotIds,
  shotNameById,
  thumbnailUrlById,
  isThumbnailListLoading,
  shotMaxFramesById,
  videoTrackByShotId,
  imageModelItems,
  draftShotPrompts,
  draftShotImageReferences,
  draftShotImageModels,
  draftShotImageSettings,
  draftShotImageSourceFrames,
  onBack,
  onCheckVideoSettings
}: {
  shotIds: string[];
  shotNameById: Map<string, string>;
  thumbnailUrlById: Record<string, string | undefined>;
  isThumbnailListLoading: boolean;
  shotMaxFramesById: Map<string, number>;
  videoTrackByShotId: Map<string, Layer | undefined>;
  imageModelItems: { key: BulkRenderingDraftImageModel; label: string }[];
  draftShotPrompts: BulkRenderingDraftShotPromptsState;
  draftShotImageReferences: BulkRenderingDraftShotImageReferencesState;
  draftShotImageModels: BulkRenderingDraftShotImageModelsState;
  draftShotImageSettings: BulkRenderingDraftShotImageSettingsState;
  draftShotImageSourceFrames: BulkRenderingDraftShotImageSourceFramesState;
  onBack: () => void;
  onCheckVideoSettings: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        className={`scrollbar-custom min-h-0 flex-1 overflow-y-auto pt-4 pb-20 pl-4 ${SCROLLBAR_COMPENSATED_RIGHT_PADDING_CLASS}`}
      >
        <div className={`grid gap-8 ${SHOT_CARD_GRID_COLUMNS_CLASS}`}>
          {shotIds.map((shotId) => {
            const imageModel = draftShotImageModels.getImageModel(shotId);
            const imageSettingKey =
              getBulkRenderingImageSettingKeyForModel(imageModel);
            const shotImageSettings = draftShotImageModels
              .imageSettingsByShotId[shotId] as Record<string, unknown>;
            const imageSettingValue = imageSettingKey
              ? ((draftShotImageSettings.getImageSetting(
                  shotId,
                  imageSettingKey
                ) ?? shotImageSettings?.[imageSettingKey]) as
                  | GptImage2Quality
                  | Nanobanana2Resolution
                  | undefined)
              : undefined;

            return (
              <BulkRenderingDraftImageShotCard
                key={shotId}
                shotId={shotId}
                shotName={shotNameById.get(shotId) ?? shotId}
                thumbnailUrl={thumbnailUrlById[shotId]}
                isThumbnailLoading={isThumbnailListLoading}
                imageSourceFrame={draftShotImageSourceFrames.getImageSourceFrame(
                  shotId
                )}
                maxImageSourceFrame={shotMaxFramesById.get(shotId) ?? 0}
                videoTrack={videoTrackByShotId.get(shotId)}
                onImageSourceFrameChange={(frameNumber) =>
                  draftShotImageSourceFrames.setImageSourceFrame(
                    shotId,
                    frameNumber
                  )
                }
                imagePrompt={draftShotPrompts.getImagePrompt(shotId)}
                onImagePromptChange={(value) =>
                  draftShotPrompts.setImagePrompt(shotId, value)
                }
                imageModel={imageModel}
                imageModelItems={imageModelItems}
                onImageModelChange={(imageModel) =>
                  draftShotImageModels.setImageModel(shotId, imageModel)
                }
                imageReferenceAssetIds={draftShotImageReferences.getImageReferenceAssetIds(
                  shotId
                )}
                onImageReferenceAssetIdsChange={(assetIds) =>
                  draftShotImageReferences.setImageReferenceAssetIds(
                    shotId,
                    assetIds
                  )
                }
                imageSettingKey={imageSettingKey}
                imageSettingValue={imageSettingValue}
                onImageSettingChange={(value) => {
                  if (!imageSettingKey) return;
                  draftShotImageSettings.setImageSetting(
                    shotId,
                    imageSettingKey,
                    value
                  );
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-end gap-2 bg-surface-secondary px-5 py-2 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]">
        <MainButton
          colorScheme="secondary"
          className={FOOTER_BUTTON_WIDTH_CLASS}
          onPress={onBack}
        >
          {t("bulk_rendering.draft_image_step_back_button.label")}
        </MainButton>
        <MainButton
          colorScheme="primary"
          className={FOOTER_BUTTON_WIDTH_CLASS}
          onPress={onCheckVideoSettings}
        >
          {t(
            "bulk_rendering.draft_image_step_check_video_settings_button.label"
          )}
        </MainButton>
      </div>
    </div>
  );
}
