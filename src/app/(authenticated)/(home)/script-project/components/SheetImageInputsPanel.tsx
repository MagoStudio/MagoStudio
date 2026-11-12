import {
  readSheetImageVersionSettings,
  SheetImageVersionSettings
} from "@domains/scriptProject/utils/readSheetImageVersionSettings";
import { SheetImage } from "@schemas/scriptProject";

import { SheetImageDescription } from "./SheetImageDescription";
import { SheetImageVersionSettingsList } from "./SheetImageVersionSettingsList";
import { VersionSettingsHeader } from "./VersionSettingsHeader";

type Props = {
  image: SheetImage;
  seedDescription: string;
  versionName: string;
  isBusy: boolean;
  onReuseSettings: (versionSettings: SheetImageVersionSettings) => void;
  onDescribeFromImage: () => void;
};

export const SheetImageInputsPanel: React.FC<Props> = ({
  image,
  seedDescription,
  versionName,
  isBusy,
  onReuseSettings,
  onDescribeFromImage
}) => {
  const versionSettings = readSheetImageVersionSettings(image);

  return (
    <div
      data-testid={`sheet-image-inputs-${image.asset_id}`}
      className="flex max-w-sm flex-col gap-3"
    >
      <VersionSettingsHeader
        versionName={versionName}
        onReuseSettings={
          versionSettings ? () => onReuseSettings(versionSettings) : undefined
        }
        isReuseSettingsDisabled={isBusy}
        reuseSettingsTestId={`sheet-image-reuse-${image.asset_id}`}
      />
      <SheetImageVersionSettingsList versionSettings={versionSettings} />
      <SheetImageDescription
        assetId={image.asset_id}
        description={image.description}
        hasDescription={image.has_description}
        seedDescription={seedDescription}
        isBusy={isBusy}
        onDescribeFromImage={onDescribeFromImage}
      />
    </div>
  );
};
