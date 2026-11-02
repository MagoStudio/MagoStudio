import { GhostButton } from "@components/GhostButton";
import { Tooltip } from "@components/Tooltip";
import { useDownloadEditVideo } from "@domains/longFormRun/useDownloadEditVideo";
import { LongFormRunViewShot } from "@domains/longFormRun/useLongFormRunView";
import { useTranslation } from "react-i18next";

interface LongFormDownloadEditButtonProps {
  shots: LongFormRunViewShot[];
  projectName: string | undefined;
}

export const LongFormDownloadEditButton: React.FC<
  LongFormDownloadEditButtonProps
> = ({ shots, projectName }) => {
  const { t } = useTranslation();
  const { downloadEditVideo, isDownloadingEditVideo, canDownloadEditVideo } =
    useDownloadEditVideo(shots, projectName);

  const hasAnyShotFailed = shots.some((shot) => shot.cardState === "failed");

  const downloadEditButton = (
    <GhostButton
      data-testid="long-form-download-edit"
      loading={isDownloadingEditVideo}
      isDisabled={!canDownloadEditVideo}
      onPress={() => void downloadEditVideo()}
    >
      {t("longForm.downloadEdit.label")}
    </GhostButton>
  );

  if (canDownloadEditVideo) return downloadEditButton;

  return (
    <Tooltip
      placement="bottom"
      textContent={
        hasAnyShotFailed
          ? t("longForm.downloadEdit.requiresEveryShot.label")
          : t("longForm.downloadPending.label")
      }
      trigger={downloadEditButton}
    />
  );
};
