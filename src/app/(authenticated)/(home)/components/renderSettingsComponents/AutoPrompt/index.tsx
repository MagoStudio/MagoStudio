import { useGetImageAsBase64 } from "@domains/asset/useGetImageAsBase64";
import { useVideoAssetPrompt } from "@domains/asset/useVideoAssetPrompt";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { useAutoPrompt } from "@home/components/renderSettingsComponents/AutoPrompt/hooks/useAutoPrompt";
import { AutoPromptDisclosure } from "@home/components/SettingsEditor/magov2/AutoPromptDisclosure";
import { AutoPromptVersionEnum } from "@hooks/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { formatPromptFromResponse } from "./helpers/formatPromptFromResponse";
import { isPromptEmpty } from "./helpers/isPromptEmpty";
import { AutoPromptVersion } from "./hooks/interface";

const AUTO_PROMPT_IMAGE_MAX_DIMENSION = 1024;

type Props = {
  disabled?: boolean;
  currentAutoPromptValue?: string;
  defaultAutoPromptValue?: string;
  onAutoPromptUpdate: (prompt: string) => void;
  styleReferenceImageId?: string;
  version?: AutoPromptVersion;
};

export const AutoPrompt: React.FC<Props> = ({
  disabled,
  currentAutoPromptValue,
  defaultAutoPromptValue,
  onAutoPromptUpdate,
  styleReferenceImageId,
  version = AutoPromptVersionEnum.IMG2IMG_MAGO
}) => {
  const { t } = useTranslation();

  const { data: styleReferenceImageBase64 } = useGetImageAsBase64({
    imageAssetId: styleReferenceImageId,
    enabled: !!styleReferenceImageId,
    resizeToMaxDimension: AUTO_PROMPT_IMAGE_MAX_DIMENSION
  });

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const videoAsset = getTrackAsset(videoTrack);
  const { data: videoAssetPrompt } = useVideoAssetPrompt({
    assetId: videoAsset?.id,
    enabled: !!videoAsset?.id && !!styleReferenceImageId
  });
  const motionDescription =
    getTrackAssetData(videoTrack)?.prompt?.positive?.content ||
    videoAssetPrompt?.formattedText ||
    "";

  const { data: sourceVideoFrameBase64 } = useVideoFrame({
    assetId: videoAsset?.id,
    selectedLayerId: videoTrack?.id,
    frameNumber: 0,
    fps: videoAsset?.data?.fps,
    enabled: !!videoAsset?.id && version === AutoPromptVersionEnum.IMG2IMG_MAGO
  });

  const handleAutoPromptGenerated = useCallback(
    (generatedPrompt: string) => {
      if (isPromptEmpty(currentAutoPromptValue, defaultAutoPromptValue)) {
        onAutoPromptUpdate(generatedPrompt);
      }
    },
    [currentAutoPromptValue, defaultAutoPromptValue, onAutoPromptUpdate]
  );

  const {
    data: generatedAutoPrompt,
    isPending: isGeneratedAutoPromptLoading,
    regenerateAutoPrompt,
    isRegeneratingAutoPrompt
  } = useAutoPrompt({
    motionDescription,
    sourceVideoFrameBase64,
    styleReferenceImageBase64,
    styleReferenceImageId,
    version,
    videoAssetId: videoAsset?.id,
    onAutoPromptGenerated: handleAutoPromptGenerated
  });

  const handleRegenerateAutoPrompt = () => {
    void regenerateAutoPrompt();
  };

  if (!styleReferenceImageId) {
    return null;
  }

  const handleAddToPrompt = () => {
    if (!generatedAutoPrompt) return;
    const formattedPrompt = formatPromptFromResponse(generatedAutoPrompt);
    const currentPrompt = currentAutoPromptValue || "";
    const shouldReplace = isPromptEmpty(currentPrompt, defaultAutoPromptValue);
    onAutoPromptUpdate(
      shouldReplace ? formattedPrompt : `${currentPrompt} ${formattedPrompt}`
    );
  };

  return (
    <AutoPromptDisclosure
      ariaLabel="add-auto-prompt-to-prompt"
      disabled={disabled}
      generatedAutoPrompt={generatedAutoPrompt}
      isActionDisabled={disabled || !generatedAutoPrompt}
      isGeneratedAutoPromptLoading={isGeneratedAutoPromptLoading}
      isRegeneratingAutoPrompt={isRegeneratingAutoPrompt}
      label={t("renderSettings.show_auto_prompt.label")}
      onAddToAutoPromptClick={handleAddToPrompt}
      onRegenerateAutoPromptClick={handleRegenerateAutoPrompt}
      styleReferenceImageId={styleReferenceImageId}
    />
  );
};
