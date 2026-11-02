import { InfoBlock } from "@components/InfoBlock";
import { Text } from "@components/Text";
import { getShouldShowCropKeyFrameWarning } from "@domains/renders/utils/getShouldShowCropKeyFrameWarning";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useDismissibleHint } from "@home/components/hooks/useDismissibleHint";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

export const CropKeyFrameWarning: React.FC = () => {
  const { t } = useTranslation();
  const { isDismissed, dismiss, isUserReady } = useDismissibleHint(
    "crop-key-frame-warning"
  );

  const { crop } = useShotCrop();
  const { selectedModelAtom, sourcesAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const sources = useAtomValue(sourcesAtom);
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();

  const shouldShowWarning = getShouldShowCropKeyFrameWarning({
    crop,
    model: selectedModel,
    sources,
    tracks: [videoTrack, ...tracks]
  });

  if (!isUserReady || isDismissed || !shouldShowWarning) return null;

  return (
    <InfoBlock variant="info" canClose onClose={dismiss}>
      <Text
        component="span"
        variant="sm"
        color="glyph-warning"
        className="leading-4"
      >
        {t("crop.key_frame_not_cropped_warning.description")}
      </Text>
    </InfoBlock>
  );
};
