import { Text } from "@components/Text";
import { UploadedShotImage } from "@domains/plan/utils/matchShotImagesToFilenames";
import { useTranslation } from "react-i18next";

interface Props {
  unmatchedUploads: UploadedShotImage[];
}

export const PlanShotImageUnmatchedNotice: React.FC<Props> = ({
  unmatchedUploads
}) => {
  const { t } = useTranslation();

  if (unmatchedUploads.length === 0) return null;

  return (
    <Text variant="2xs" color="glyph-tertiary">
      {t("plan.shot_images.unmatched_notice.label", {
        fileNames: unmatchedUploads.map((upload) => upload.fileName).join(", ")
      })}
    </Text>
  );
};
