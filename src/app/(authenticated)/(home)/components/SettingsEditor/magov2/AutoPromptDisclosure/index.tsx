import { DisclosureIconButton } from "@components/DisclosureIconButton";
import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { useImageAssetPrompt } from "@domains/asset/useImageAssetPrompt";
import { useVideoAssetPrompt } from "@domains/asset/useVideoAssetPrompt";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from "@headlessui/react";
import { AssetPromptResponse } from "@hooks/assets/interface";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { useFilteredAndSortedTracks } from "@/domains/track/useFilteredAndSortedTracks";
import { getTrackAssetId } from "@/domains/track/utils/getTrackAssetId";

import { AutoPromptDisclosureSection } from "./AutoPromptDisclosureSection";

type Props = {
  ariaLabel?: string;
  disabled?: boolean;
  generatedAutoPrompt?: AssetPromptResponse;
  isActionDisabled?: boolean;
  isGeneratedAutoPromptLoading?: boolean;
  isRegeneratingAutoPrompt?: boolean;
  label: string;
  onAddToAutoPromptClick: () => void;
  onRegenerateAutoPromptClick: () => void;
  styleReferenceImageId?: string;
};

export const AutoPromptDisclosure: React.FC<Props> = ({
  ariaLabel,
  disabled,
  generatedAutoPrompt,
  isActionDisabled,
  isGeneratedAutoPromptLoading,
  isRegeneratingAutoPrompt,
  label,
  onAddToAutoPromptClick,
  onRegenerateAutoPromptClick,
  styleReferenceImageId
}: Props) => {
  const { t } = useTranslation();

  const { data: imageAssetPrompt, isLoading: isImageAssetPromptLoading } =
    useImageAssetPrompt({
      assetId: styleReferenceImageId,
      enabled: !!styleReferenceImageId
    });

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const videoAssetId = getTrackAssetId(videoTrack);

  const { data: videoAssetPrompt, isLoading: isVideoAssetPromptLoading } =
    useVideoAssetPrompt({
      assetId: videoAssetId,
      enabled: !!videoAssetId
    });

  const hasContentOrLoading =
    generatedAutoPrompt ||
    imageAssetPrompt?.prompt ||
    videoAssetPrompt?.prompt ||
    isGeneratedAutoPromptLoading ||
    isImageAssetPromptLoading ||
    isVideoAssetPromptLoading;

  const isUseButtonDisabled =
    isActionDisabled ||
    isRegeneratingAutoPrompt ||
    isGeneratedAutoPromptLoading;
  const isRegenerateButtonDisabled =
    isRegeneratingAutoPrompt || isGeneratedAutoPromptLoading;

  return (
    <Disclosure>
      {({ open }) => (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1">
            <DisclosureButton
              as="div"
              className={cn(
                "group flex items-center justify-between",
                hasContentOrLoading ? "cursor-pointer" : "cursor-default"
              )}
              disabled={!hasContentOrLoading}
            >
              <div className="-ml-2 flex items-center">
                <DisclosureIconButton
                  arrowDirections={{
                    closedDirection: "right",
                    openedDirection: "down"
                  }}
                  color="glyph-tertiary"
                  open={open}
                />
                <Text
                  color="glyph-tertiary"
                  select="none"
                  variant="sm"
                  className={
                    hasContentOrLoading
                      ? "group-hover:text-glyph-primary"
                      : undefined
                  }
                >
                  {label}
                </Text>
              </div>
            </DisclosureButton>
            <div className="flex items-center justify-end gap-1">
              <div>
                <GhostButton
                  aria-label="Regenerate auto-prompt"
                  isDisabled={isRegenerateButtonDisabled || disabled}
                  loading={isRegeneratingAutoPrompt}
                  onPress={onRegenerateAutoPromptClick}
                >
                  {t("renderSettings.regenerate_auto_prompt.label")}
                </GhostButton>
              </div>
              <Tooltip
                textContent={t("buttonTooltips.add_to_prompt_button.label")}
                placement="top"
              >
                <GhostButton
                  aria-label={ariaLabel}
                  isDisabled={isUseButtonDisabled || disabled}
                  loading={isGeneratedAutoPromptLoading}
                  onPress={onAddToAutoPromptClick}
                >
                  {t("renderSettings.use_auto_prompt.label")}
                </GhostButton>
              </Tooltip>
            </div>
          </div>

          <DisclosurePanel
            className="flex flex-col gap-2 w-full pl-6 origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0"
            transition
          >
            <AutoPromptDisclosureSection
              isLoading={
                isGeneratedAutoPromptLoading || isRegeneratingAutoPrompt
              }
              text={generatedAutoPrompt?.prompt?.positive?.content}
            />
            <AutoPromptDisclosureSection
              isLoading={isVideoAssetPromptLoading}
              title={t(
                "renderSettings.video_description_detailed_prompt.label"
              )}
              text={videoAssetPrompt?.formattedText}
            />
            <AutoPromptDisclosureSection
              isLoading={isImageAssetPromptLoading}
              title={t(
                "renderSettings.image_description_detailed_prompt.label"
              )}
              text={imageAssetPrompt?.formattedText}
            />
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};
