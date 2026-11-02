import { Text } from "@components/Text";
import { CutShotVersionsInDisplayOrder } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { CutShotVersionDialog } from "./CutShotVersionDialog";

const MINIMUM_VERSIONS_WORTH_LISTING = 3;

type Props = {
  projectId?: string;
  shot: CutShot;
  outputSize: ProjectOutputSize;
  versionsInDisplayOrder: CutShotVersionsInDisplayOrder;
  isBusy: boolean;
  onPin: (assetId: string | null) => void;
  onReuseSettings: (version: CutShotVersion) => void;
};

export const CutShotShowAllVersionsLink: React.FC<Props> = ({
  projectId,
  shot,
  outputSize,
  versionsInDisplayOrder,
  isBusy,
  onPin,
  onReuseSettings
}) => {
  const { t } = useTranslation();
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const { shownVersion } = versionsInDisplayOrder;

  if (!shownVersion || shot.versions.length < MINIMUM_VERSIONS_WORTH_LISTING)
    return null;

  return (
    <>
      <AriaButton
        isDisabled={isBusy}
        onPress={() => setIsVersionDialogOpen(true)}
        className="self-start outline-hidden data-[disabled]:opacity-50 data-[hovered]:opacity-80"
        data-testid={`cut-version-show-all-${shot.timeline_id}`}
      >
        <Text component="span" variant="sm" color="glyph-action-main">
          {t("script_project.show_all_shot_versions_link.label", {
            count: shot.versions.length
          })}
        </Text>
      </AriaButton>

      <CutShotVersionDialog
        projectId={projectId}
        shot={shot}
        outputSize={outputSize}
        versionsInDisplayOrder={versionsInDisplayOrder}
        shownVersionAssetId={shownVersion.asset_id}
        isOpen={isVersionDialogOpen}
        isBusy={isBusy}
        onOpenChange={setIsVersionDialogOpen}
        onPin={onPin}
        onReuseSettings={onReuseSettings}
      />
    </>
  );
};
