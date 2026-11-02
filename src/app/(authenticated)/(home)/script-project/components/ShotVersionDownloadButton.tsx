import { buildDownloadFilename } from "@app/utils/files/buildDownloadFilename";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { downloadFile } from "@hooks/files/utils";
import { useTranslation } from "react-i18next";

interface Props {
  videoUrl: string | null;
  downloadFileName: string;
  className?: string;
  testId: string;
}

export const ShotVersionDownloadButton: React.FC<Props> = ({
  videoUrl,
  downloadFileName,
  className,
  testId
}) => {
  const { t } = useTranslation();
  if (!videoUrl) return null;

  return (
    <IconActionButton
      aria-label={t("script_project.download_version_button.ariaLabel")}
      icon={<Icon iconSet="16" iconName="download" />}
      variant="onImage"
      size="xs"
      className={className}
      onPress={() =>
        void downloadFile(videoUrl, buildDownloadFilename(downloadFileName))
      }
      data-testid={testId}
    />
  );
};
