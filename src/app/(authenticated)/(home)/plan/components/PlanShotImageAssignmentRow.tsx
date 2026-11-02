import { Dropdown, DropdownItem } from "@components/Dropdown";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import {
  getShotImageAssignmentStatusColor,
  getShotImageAssignmentStatusLabelKey
} from "@domains/plan/utils/getShotImageAssignmentStatusDisplay";
import { ShotImageAssignment } from "@domains/plan/utils/matchShotImagesToFilenames";
import { truncateFileNameFixed } from "@home/components/fileUpload/helpers/truncateFileName";
import { useTranslation } from "react-i18next";

const NONE_OPTION_KEY = "__none__";
const FILENAME_MAX_LENGTH = 20;

interface Props {
  shotName: string;
  assignment: ShotImageAssignment;
  doneUploads: Array<{ uploadKey: string; fileName: string }>;
  onChange: (assetId: string | null) => void;
}

export const PlanShotImageAssignmentRow: React.FC<Props> = ({
  shotName,
  assignment,
  doneUploads,
  onChange
}) => {
  const { t } = useTranslation();
  const { data: imageAsset } = useImageAsset({
    assetId: assignment.matchedUploadKey
  });

  const dropdownItems: DropdownItem[] = [
    {
      key: NONE_OPTION_KEY,
      label: t("plan.shot_images.no_image_option.label")
    },
    ...doneUploads.map((upload) => ({
      key: upload.uploadKey,
      label: truncateFileNameFixed(upload.fileName, FILENAME_MAX_LENGTH, 0)
    }))
  ];

  return (
    <div
      className="flex items-center gap-3 py-1.5"
      data-testid={`plan-shot-image-row-${assignment.shotId}`}
    >
      <div className="w-10 h-10 shrink-0">
        {assignment.matchedUploadKey && imageAsset ? (
          <ImageThumbnail
            src={imageAsset.urlToUse}
            alt={imageAsset.asset.name}
            classNames={{ root: "aspect-square" }}
          />
        ) : (
          <div className="w-10 h-10 rounded bg-element-primary" />
        )}
      </div>
      <Text
        variant="sm"
        color="glyph-primary"
        className="flex-1 min-w-0 truncate"
      >
        {shotName}
      </Text>
      <Text
        variant="xs"
        color={getShotImageAssignmentStatusColor(assignment.status)}
        data-testid="plan-shot-image-status"
      >
        {t(getShotImageAssignmentStatusLabelKey(assignment.status))}
      </Text>
      <Dropdown
        className="w-40"
        aria-label={`Select an image for ${shotName}`}
        items={dropdownItems}
        selectedKey={assignment.matchedUploadKey ?? NONE_OPTION_KEY}
        onSelectionChange={(key) =>
          onChange(key === NONE_OPTION_KEY ? null : (key as string))
        }
      />
    </div>
  );
};
