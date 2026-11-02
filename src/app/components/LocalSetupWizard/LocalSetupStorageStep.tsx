import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { RadioGroup } from "react-aria-components";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

import { LocalSetupDriveOption } from "./LocalSetupDriveOption";
import { LocalSetupStatusMark } from "./LocalSetupStatusMark";
import { LocalSetupWizardActions } from "./LocalSetupWizardActions";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";
import type { LocalSetupDrive } from "./localSetupWizardStubs";

export const LocalSetupStorageStep = ({
  requiredGigabytes,
  isPending,
  error,
  onRefresh,
  outcome,
  drives,
  selectedDriveId,
  onSelectDrive,
  onContinue,
  onChooseAnotherDrive,
  onChooseInstallFolder
}: {
  requiredGigabytes: number;
  isPending: boolean;
  error: string | null;
  onRefresh: () => void;
  outcome: "choosing" | "insufficient";
  drives: LocalSetupDrive[];
  selectedDriveId: string;
  onSelectDrive: (driveId: string) => void;
  onContinue: () => void;
  onChooseAnotherDrive: () => void;
  onChooseInstallFolder: () => void;
}) => {
  const { t } = useTranslation();
  const selectedDrive = drives.find((drive) => drive.id === selectedDriveId);

  if (
    outcome === "insufficient" &&
    selectedDrive &&
    selectedDrive.freeGigabytes !== null
  ) {
    const missingGigabytes = (
      requiredGigabytes - selectedDrive.freeGigabytes
    ).toFixed(1);

    return (
      <LocalSetupWizardCard>
        <div className="flex items-center gap-2">
          <LocalSetupStatusMark outcome="warning" />
          <Text component="span" variant="lg">
            {t("localSetup.storage.insufficientTitle", {
              defaultValue: "Not enough space on {{drive}}",
              drive: selectedDrive.name
            })}
          </Text>
        </div>

        <Text variant="sm" color="glyph-secondary">
          {t("localSetup.storage.insufficientDescription", {
            defaultValue:
              "You need {{required}} GB. This drive has {{free}} GB free.",
            required: requiredGigabytes,
            free: selectedDrive.freeGigabytes.toFixed(1)
          })}
        </Text>

        <LinearProgress
          size="lg"
          value={selectedDrive.freeGigabytes}
          totalValue={requiredGigabytes}
          color="element-additional-active"
          className="min-w-0 flex-none rounded-full bg-element-tertiary"
        />

        <Text variant="sm" color="glyph-tertiary">
          {t("localSetup.storage.insufficientHint", {
            defaultValue:
              "Free up {{missing}} GB, or pick a drive with more room.",
            missing: missingGigabytes
          })}
        </Text>

        {error && (
          <Text variant="sm" color="glyph-error">
            {error}
          </Text>
        )}
        {isPending && (
          <Text variant="sm" color="glyph-secondary">
            Checking drives...
          </Text>
        )}
        <LocalSetupWizardActions
          primaryLabel={t("localSetup.storage.chooseAnotherDrive", {
            defaultValue: "Choose another drive"
          })}
          onPrimaryPress={onChooseAnotherDrive}
          secondaryLabel={t("localSetup.storage.checkAgain", {
            defaultValue: "Check again"
          })}
          onSecondaryPress={onRefresh}
        />
      </LocalSetupWizardCard>
    );
  }

  return (
    <LocalSetupWizardCard>
      <Text variant="lg">
        {t("localSetup.storage.title", {
          defaultValue: "Where should Mago keep the engine?"
        })}
      </Text>

      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.storage.description", {
          defaultValue:
            "ComfyUI, starter models and temporary extraction files need {{required}} GB.",
          required: requiredGigabytes
        })}
      </Text>

      {isPending && (
        <Text variant="sm" color="glyph-secondary">
          Checking drives...
        </Text>
      )}
      {error && (
        <Text variant="sm" color="glyph-error">
          {error}
        </Text>
      )}
      {!isPending && !drives.length && (
        <Text variant="sm" color="glyph-secondary">
          No drives found. Choose a folder below.
        </Text>
      )}
      <div className="flex flex-col gap-2">
        <AriaLink
          className="cursor-pointer self-end text-sm text-glyph-action-main underline"
          onPress={onRefresh}
          isDisabled={isPending}
        >
          Refresh drives
        </AriaLink>
        <RadioGroup
          isDisabled={isPending}
          aria-label={t("localSetup.storage.driveGroupLabel", {
            defaultValue: "Destination drive"
          })}
          value={selectedDriveId}
          onChange={onSelectDrive}
          className="flex flex-col gap-2"
        >
          {drives.map((drive) => (
            <LocalSetupDriveOption
              key={drive.id}
              driveId={drive.id}
              name={drive.name}
              freeSpaceLabel={
                drive.freeGigabytes === null
                  ? "Free space unknown"
                  : t("localSetup.storage.freeSpace", {
                      defaultValue: "{{free}} GB free",
                      free: drive.freeGigabytes?.toFixed(1)
                    })
              }
              hasEnoughRoom={(drive.freeGigabytes ?? -1) >= requiredGigabytes}
            />
          ))}
        </RadioGroup>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {selectedDrive && (
          <Text variant="sm" color="glyph-secondary" className="break-all">
            Install location: {selectedDrive.rootPath}
            {selectedDrive.rootPath.endsWith("\\") ||
            selectedDrive.rootPath.endsWith("/")
              ? ""
              : selectedDrive.rootPath.includes("\\")
                ? "\\"
                : "/"}
            MagoStudio
          </Text>
        )}

        <AriaLink
          className="cursor-pointer"
          isDisabled={isPending}
          onPress={onChooseInstallFolder}
        >
          <Text
            component="span"
            variant="sm"
            color="glyph-action-main"
            decoration="underline"
          >
            {t("localSetup.storage.chooseFolder", {
              defaultValue: "Use another folder"
            })}
          </Text>
        </AriaLink>
      </div>

      <LocalSetupWizardActions
        isPrimaryDisabled={
          isPending ||
          !selectedDrive ||
          selectedDrive.freeGigabytes === null ||
          selectedDrive.freeGigabytes < requiredGigabytes
        }
        primaryLabel={t("localSetup.storage.continue", {
          defaultValue: "Continue"
        })}
        onPrimaryPress={onContinue}
      />
    </LocalSetupWizardCard>
  );
};
