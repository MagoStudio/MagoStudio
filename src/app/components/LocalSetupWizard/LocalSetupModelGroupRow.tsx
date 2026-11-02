import { Checkbox } from "@components/Checkbox";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import {
  isModelGroupAlwaysInstalled,
  type LocalModelGroupId,
  type LocalModelGroupInstallState
} from "../../../../desktop/shared/localModelGroups";

const BYTES_PER_GIB = 1_073_741_824;
const ONE_DECIMAL_PLACE = 10;

export const LocalSetupModelGroupRow = ({
  groupId,
  state,
  missingBytes,
  isChecked,
  isLocked,
  onToggle
}: {
  groupId: LocalModelGroupId;
  state: LocalModelGroupInstallState;
  missingBytes: number;
  isChecked: boolean;
  isLocked: boolean;
  onToggle: (isChecked: boolean) => void;
}) => {
  const { t } = useTranslation();
  const missingGigabytes =
    Math.round((missingBytes / BYTES_PER_GIB) * ONE_DECIMAL_PLACE) /
    ONE_DECIMAL_PLACE;
  const statusLabel =
    state === "installed"
      ? t("localSetup.models.installed")
      : state === "partial"
        ? t("localSetup.models.updateAvailable")
        : isModelGroupAlwaysInstalled(groupId)
          ? t("localSetup.models.alwaysInstalled")
          : null;
  const isDownloadSizeShown = state !== "installed";

  return (
    <div className="flex items-start justify-between gap-3 border-b border-element-primary py-2">
      <div className="flex min-w-0 flex-col gap-1">
        <Checkbox
          inputId={`local-setup-model-group-${groupId}`}
          isChecked={isChecked}
          disabled={isLocked}
          label={t(`localSetup.models.groups.${groupId}.name`)}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <div className="flex flex-col gap-0.5 pl-[26px]">
          <Text variant="xs" color="glyph-tertiary">
            {t(`localSetup.models.groups.${groupId}.description`)}
          </Text>
          {statusLabel && (
            <Text
              variant="xs"
              color={state === "partial" ? "glyph-warning" : "glyph-secondary"}
            >
              {statusLabel}
            </Text>
          )}
        </div>
      </div>
      {isDownloadSizeShown && (
        <Text
          component="span"
          variant="xs"
          color="glyph-secondary"
          className="shrink-0"
        >
          {t("localSetup.models.size", { gigabytes: missingGigabytes })}
        </Text>
      )}
    </div>
  );
};
