import { LocalSetupWarningTooltip } from "@app/components/LocalSetupWizard/LocalSetupWarningTooltip";
import { CloseButton } from "@components/CloseButton";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { ProjectType } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { ProjectCreationTarget } from "@/domains/project/projectCreationTarget";

const DIALOG_MAX_WIDTH_PX = 640;
const SETUP_TOOLTIP_WIDTH_CLASS_NAME = "w-auto max-w-60";

type Props = {
  projectType: ProjectType;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isLocalProjectCreationReady: boolean;
  isCloudProjectCreationReady: boolean;
  isCreatingProject: boolean;
  onCreateProject: (creationTarget: ProjectCreationTarget) => void;
  onSetUpLocalRendering: () => void;
  onSignInToCloud: () => void;
};

export const CreateProjectDestinationDialog: React.FC<Props> = ({
  projectType,
  isOpen,
  onOpenChange,
  isLocalProjectCreationReady,
  isCloudProjectCreationReady,
  isCreatingProject,
  onCreateProject,
  onSetUpLocalRendering,
  onSignInToCloud
}) => {
  const { t } = useTranslation();

  const destinations = [
    {
      creationTarget: "local",
      isDestinationReady: isLocalProjectCreationReady,
      createLabel: t("script_project.create_local_project_button.label"),
      setupMessage: t("localSetup.localRenderBlocked.setupUnfinished"),
      setupActionLabel: t("actions.setup_local_render.label"),
      onSetup: onSetUpLocalRendering
    },
    {
      creationTarget: "cloud",
      isDestinationReady: isCloudProjectCreationReady,
      createLabel: t("script_project.create_cloud_project_button.label"),
      setupMessage: t(
        "script_project.create_destination_cloud_sign_in_tooltip.label"
      ),
      setupActionLabel: t("script_project.text_access_sign_in.label"),
      onSetup: onSignInToCloud
    }
  ] as const;

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={{ mode: "hug", maxWidthPx: DIALOG_MAX_WIDTH_PX }}
    >
      <div
        className="relative flex w-full flex-col gap-6 p-8"
        data-testid="create-project-destination-dialog"
      >
        <div className="absolute right-4 top-4">
          <CloseButton onPress={() => onOpenChange(false)} />
        </div>

        <Text component="h4" variant="xl" weight="semibold">
          {t("script_project.create_destination_dialog_title.label", {
            projectType: t(`project_types.${projectType}.label`)
          })}
        </Text>

        <div className="flex flex-col gap-2">
          <Text variant="sm" weight="semibold">
            {t("script_project.create_destination.label")}
          </Text>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {destinations.map((destination) => {
              const createButton = (
                <MainButton
                  colorScheme="primary"
                  fullWidth
                  isDisabled={
                    !destination.isDestinationReady || isCreatingProject
                  }
                  loading={destination.isDestinationReady && isCreatingProject}
                  onPress={() => onCreateProject(destination.creationTarget)}
                  data-testid={`create-project-destination-${destination.creationTarget}`}
                >
                  {destination.createLabel}
                </MainButton>
              );
              return (
                <div
                  key={destination.creationTarget}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-element-primary bg-surface-primary p-5"
                >
                  <div className="flex flex-col gap-2">
                    <Text variant="lg" weight="semibold">
                      {t(
                        `script_project.create_destination_${destination.creationTarget}.label`
                      )}
                    </Text>
                    <Text
                      variant="sm"
                      color="glyph-secondary"
                      lineHeight="relaxed"
                    >
                      {t(
                        `script_project.create_destination_${destination.creationTarget}.description`
                      )}
                    </Text>
                  </div>
                  {destination.isDestinationReady ? (
                    createButton
                  ) : (
                    <LocalSetupWarningTooltip
                      placement="bottom"
                      className={SETUP_TOOLTIP_WIDTH_CLASS_NAME}
                      message={destination.setupMessage}
                      actionLabel={destination.setupActionLabel}
                      onAction={destination.onSetup}
                    >
                      {createButton}
                    </LocalSetupWarningTooltip>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
};
