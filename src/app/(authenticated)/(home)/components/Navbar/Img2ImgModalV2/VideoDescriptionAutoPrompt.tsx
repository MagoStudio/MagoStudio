import { DisclosureIconButton } from "@components/DisclosureIconButton";
import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { useVideoAssetPrompt } from "@domains/asset/useVideoAssetPrompt";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from "@headlessui/react";
import { AutoPromptDisclosureSection } from "@home/components/SettingsEditor/magov2/AutoPromptDisclosure/AutoPromptDisclosureSection";
import { useTranslation } from "react-i18next";

import { useFilteredAndSortedTracks } from "@/domains/track/useFilteredAndSortedTracks";
import { getTrackAssetId } from "@/domains/track/utils/getTrackAssetId";

type Props = {
  onUsePrompt: (prompt: string) => void;
};

export function VideoDescriptionAutoPrompt({ onUsePrompt }: Props) {
  const { t } = useTranslation();

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const videoAssetId = getTrackAssetId(videoTrack);

  const { data: videoAssetPrompt, isLoading: isVideoAssetPromptLoading } =
    useVideoAssetPrompt({
      assetId: videoAssetId,
      enabled: !!videoAssetId
    });

  const hasContent =
    videoAssetPrompt?.formattedText || isVideoAssetPromptLoading;

  if (!videoAssetId || !hasContent) return null;

  const handleUse = () => {
    if (videoAssetPrompt?.formattedText) {
      onUsePrompt(videoAssetPrompt.formattedText);
    }
  };

  return (
    <Disclosure>
      {({ open }) => (
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between gap-1">
            <DisclosureButton
              as="div"
              className="flex items-center justify-between"
              disabled={!hasContent}
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
                <Text color="glyph-tertiary" select="none" variant="sm">
                  {t("renderSettings.show_auto_prompt.label")}
                </Text>
              </div>
            </DisclosureButton>
            <Tooltip
              textContent={t("buttonTooltips.add_to_prompt_button.label")}
              placement="top"
            >
              <GhostButton
                aria-label="Use video description prompt"
                isDisabled={
                  isVideoAssetPromptLoading || !videoAssetPrompt?.formattedText
                }
                onPress={handleUse}
              >
                {t("renderSettings.use_auto_prompt.label")}
              </GhostButton>
            </Tooltip>
          </div>

          <DisclosurePanel
            className="flex w-full origin-top flex-col gap-2 pl-6 transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0"
            transition
          >
            <AutoPromptDisclosureSection
              isLoading={isVideoAssetPromptLoading}
              title={t(
                "renderSettings.video_description_detailed_prompt.label"
              )}
              text={videoAssetPrompt?.formattedText}
            />
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
}
