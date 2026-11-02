import { GhostButton } from "@components/GhostButton";
import { Tooltip } from "@components/Tooltip";
import { useDownloadAllShots } from "@domains/longFormRun/useDownloadAllShots";
import { LongFormRunViewShot } from "@domains/longFormRun/useLongFormRunView";
import { useTranslation } from "react-i18next";

interface LongFormDownloadAllButtonProps {
  shots: LongFormRunViewShot[];
}

export const LongFormDownloadAllButton: React.FC<
  LongFormDownloadAllButtonProps
> = ({ shots }) => {
  const { t } = useTranslation();
  const {
    downloadAllShots,
    isDownloadingAllShots,
    canDownloadAllShots,
    areAllShotsSettled
  } = useDownloadAllShots(shots);

  const downloadAllButton = (
    <GhostButton
      data-testid="long-form-download-all"
      loading={isDownloadingAllShots}
      isDisabled={!canDownloadAllShots}
      onPress={() => void downloadAllShots()}
    >
      {t("longForm.downloadAll.label")}
    </GhostButton>
  );

  if (canDownloadAllShots) return downloadAllButton;

  return (
    <Tooltip
      placement="bottom"
      textContent={
        areAllShotsSettled
          ? t("longForm.downloadAll.nothingGenerated.label")
          : t("longForm.downloadPending.label")
      }
      trigger={downloadAllButton}
    />
  );
};
