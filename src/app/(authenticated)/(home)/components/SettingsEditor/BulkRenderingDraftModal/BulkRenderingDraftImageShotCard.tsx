import { ControlLabel } from "@components/ControlLabel";
import { DropdownWithLabelInside } from "@components/DropdownWithLabelInside";
import { FileDropZone } from "@components/FileDropZone";
import { GhostButton } from "@components/GhostButton";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { MediaTile } from "@components/MediaTile";
import { Text } from "@components/Text";
import { BulkRenderingDraftImageModel } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageModels";
import { useOptimizablePrompt } from "@domains/prompt/useOptimizablePrompt";
import { useTrackFrameSrc } from "@domains/track/useTrackFrameSrc";
import { MAX_IMAGE_REFERENCE_UPLOADS } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import {
  GPT_IMAGE_2_QUALITIES,
  GptImage2Quality
} from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import {
  NANOBANANA_2_RESOLUTIONS,
  Nanobanana2Resolution
} from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";
import { useIsImagePortrait } from "@hooks/useIsImagePortrait";
import { Layer } from "@schemas/layer";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftFrameSelection } from "./BulkRenderingDraftFrameSelection";
import { BulkRenderingDraftPromptField } from "./BulkRenderingDraftPromptField";

export function BulkRenderingDraftImageShotCard({
  shotId,
  shotName,
  thumbnailUrl,
  isThumbnailLoading,
  imageSourceFrame,
  maxImageSourceFrame,
  videoTrack,
  onImageSourceFrameChange,
  imagePrompt,
  onImagePromptChange,
  imageModel,
  imageModelItems,
  onImageModelChange,
  imageReferenceAssetIds,
  onImageReferenceAssetIdsChange,
  imageSettingKey,
  imageSettingValue,
  onImageSettingChange
}: {
  shotId: string;
  shotName: string;
  thumbnailUrl: string | undefined;
  isThumbnailLoading: boolean;
  imageSourceFrame: number;
  maxImageSourceFrame: number;
  videoTrack: Layer | undefined;
  onImageSourceFrameChange: (frameNumber: number) => void;
  imagePrompt: string;
  onImagePromptChange: (value: string) => void;
  imageModel: BulkRenderingDraftImageModel;
  imageModelItems: { key: BulkRenderingDraftImageModel; label: string }[];
  onImageModelChange: (imageModel: BulkRenderingDraftImageModel) => void;
  imageReferenceAssetIds: string[];
  onImageReferenceAssetIdsChange: (assetIds: string[]) => void;
  imageSettingKey: "quality" | "resolution" | undefined;
  imageSettingValue: GptImage2Quality | Nanobanana2Resolution | undefined;
  onImageSettingChange: (
    value: GptImage2Quality | Nanobanana2Resolution
  ) => void;
}) {
  const { t } = useTranslation();
  const { trackFrameSrc, isLoading: isFrameLoading } = useTrackFrameSrc({
    track: videoTrack,
    frameNumber: imageSourceFrame
  });
  const previewUrl = trackFrameSrc ?? thumbnailUrl;
  const isPreviewPortrait = useIsImagePortrait(previewUrl);
  const {
    optimizePrompt,
    undoOptimizePrompt,
    isOptimizingPrompt,
    canUndoOptimizePrompt,
    optimizeRouteLabel,
    isOptimizeRoutePending
  } = useOptimizablePrompt({
    value: imagePrompt,
    onChange: (value) => {
      onImagePromptChange(value ?? "");
    }
  });

  return (
    <div
      data-testid={`bulk-rendering-draft-image-shot-card-${shotId}`}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex h-6 items-center">
        <Text component="span" variant="sm" color="glyph-secondary">
          {shotName}
        </Text>
      </div>
      <div className="flex w-full items-stretch gap-3">
        <MediaTile
          className="h-[400px] w-[282px] shrink-0"
          thumbnailUrl={previewUrl}
          thumbnailScaleMode={isPreviewPortrait ? "fill" : "fit"}
          isLoading={isThumbnailLoading || (!previewUrl && isFrameLoading)}
          tilePresentation="asset"
          footer={
            <div className="flex items-center px-2 pb-2">
              <BulkRenderingDraftFrameSelection
                frameNumber={imageSourceFrame}
                maxFrameNumber={maxImageSourceFrame}
                onFrameNumberChange={onImageSourceFrameChange}
              />
            </div>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <BulkRenderingDraftPromptField
            shotName={shotName}
            value={imagePrompt}
            onChange={onImagePromptChange}
            minHeightClassName="min-h-[181px]"
            actions={
              <>
                <GhostButton
                  onPress={() => void optimizePrompt()}
                  loading={isOptimizingPrompt}
                  isDisabled={isOptimizingPrompt || isOptimizeRoutePending}
                >
                  {t("bulk_rendering.draft_shot_card_optimize_button.label")}
                  {optimizeRouteLabel && ` ${optimizeRouteLabel}`}
                </GhostButton>
                {canUndoOptimizePrompt && (
                  <GhostButton
                    onPress={undoOptimizePrompt}
                    isDisabled={isOptimizingPrompt}
                  >
                    {t("actions.undo.label")}
                  </GhostButton>
                )}
              </>
            }
          />
          <DropdownWithLabelInside
            className="h-8 w-full"
            label={t("bulk_rendering.draft_shot_card_model_label.label")}
            items={imageModelItems}
            selectedKey={imageModel}
            onSelectionChange={(key) => {
              const selectedImageModel = imageModelItems.find(
                (item) => item.key === String(key)
              )?.key;
              if (selectedImageModel) onImageModelChange(selectedImageModel);
            }}
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <ControlLabel
                labelColor="glyph-tertiary"
                label={t(
                  "bulk_rendering.draft_shot_card_image_reference_label.label"
                )}
              />
              <InfoTooltipIcon
                tooltip={t("img2imgForms.common.image_style_reference.tooltip")}
                labelColor="glyph-tertiary"
              />
            </div>
            <FileDropZone
              size="small"
              value={imageReferenceAssetIds}
              onChange={onImageReferenceAssetIdsChange}
              maxFileUpload={MAX_IMAGE_REFERENCE_UPLOADS}
            />
          </div>
          {imageSettingKey === "quality" && (
            <DropdownWithLabelInside
              className="h-8 w-full"
              label={t("img2imgForms.gpt_image_2.quality.label")}
              items={GPT_IMAGE_2_QUALITIES.map((quality) => ({
                key: quality,
                label: quality
              }))}
              selectedKey={imageSettingValue as GptImage2Quality}
              onSelectionChange={(key) =>
                onImageSettingChange(key as GptImage2Quality)
              }
            />
          )}
          {imageSettingKey === "resolution" && (
            <DropdownWithLabelInside
              className="h-8 w-full"
              label={t("img2imgForms.nanobanana_2.resolution.label")}
              items={NANOBANANA_2_RESOLUTIONS.map((resolution) => ({
                key: resolution,
                label: resolution
              }))}
              selectedKey={imageSettingValue as Nanobanana2Resolution}
              onSelectionChange={(key) =>
                onImageSettingChange(key as Nanobanana2Resolution)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
