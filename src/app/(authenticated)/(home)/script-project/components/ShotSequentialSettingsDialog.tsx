import { CloseButton } from "@components/CloseButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { resolveSequentialShotConfig } from "@domains/scriptProject/utils/resolveSequentialShotConfig";
import {
  SequentialPromptDefaults,
  SequentialShotConfig,
  ShotState
} from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ShotSequentialControls } from "./ShotSequentialControls";

const DIALOG_MAX_WIDTH_PX = 480;

type Props = {
  shot: ShotState;
  predecessorShot: ShotState;
  sequentialPromptDefaults: SequentialPromptDefaults | null;
  isDisabled: boolean;
  onSaveSequential: (sequential: SequentialShotConfig) => void;
  onClose: () => void;
  testIdSuffix: string | number;
};

export const ShotSequentialSettingsDialog: React.FC<Props> = ({
  shot,
  predecessorShot,
  sequentialPromptDefaults,
  isDisabled,
  onSaveSequential,
  onClose,
  testIdSuffix
}) => {
  const { t } = useTranslation();
  const [savedSequential] = useState(() =>
    resolveSequentialShotConfig(shot.sequential)
  );
  const [draftSequential, setDraftSequential] = useState(savedSequential);

  const saveChangesAndClose = () => {
    const hasUnsavedSequentialChanges =
      JSON.stringify(draftSequential) !== JSON.stringify(savedSequential);
    if (hasUnsavedSequentialChanges) onSaveSequential(draftSequential);
    onClose();
  };

  return (
    <OverlayDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) saveChangesAndClose();
      }}
      size={{ mode: "hug", maxWidthPx: DIALOG_MAX_WIDTH_PX }}
    >
      <div
        className="relative flex w-[480px] max-w-full flex-col gap-4 p-6"
        data-testid="shot-sequential-settings-dialog"
      >
        <div className="absolute right-4 top-4">
          <CloseButton onPress={saveChangesAndClose} />
        </div>

        <Text component="h4" variant="lg" weight="semibold" className="pr-8">
          {t("script_project.shot_sequential_settings_dialog_title.label")}
        </Text>

        <ShotSequentialControls
          sequential={draftSequential}
          sequentialPromptDefaults={sequentialPromptDefaults}
          predecessorShot={predecessorShot}
          isDisabled={isDisabled}
          onChange={setDraftSequential}
          testIdSuffix={testIdSuffix}
        />
      </div>
    </OverlayDialog>
  );
};
