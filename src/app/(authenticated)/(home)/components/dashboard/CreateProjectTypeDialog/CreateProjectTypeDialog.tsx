import { CloseButton } from "@components/CloseButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import {
  ProjectCreationAvailability,
  ProjectCreationTarget
} from "@/domains/project/projectCreationTarget";

const DIALOG_MAX_WIDTH_PX = 640;

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChooseScenario: () => void;
  onChooseVideo: () => void;
  isCreatingProject: boolean;
  creationTarget: ProjectCreationTarget;
  creationAvailability: ProjectCreationAvailability;
  isCheckingCreationAvailability: boolean;
  onCreationTargetChange: (target: ProjectCreationTarget) => void;
};

export const CreateProjectTypeDialog: React.FC<Props> = ({
  isOpen,
  onOpenChange,
  onChooseScenario,
  onChooseVideo,
  isCreatingProject,
  creationTarget,
  creationAvailability,
  isCheckingCreationAvailability,
  onCreationTargetChange
}) => {
  const { t } = useTranslation();

  const choices = [
    {
      id: "scenario",
      label: t("script_project.start_from_scenario.label"),
      description: t("script_project.start_from_scenario.description"),
      onPress: onChooseScenario
    },
    {
      id: "video",
      label: t("script_project.start_from_video.label"),
      description: t("script_project.start_from_video.description"),
      onPress: onChooseVideo
    }
  ];
  const destinations = (["local", "cloud"] as const).filter(
    (target) => creationAvailability[target]
  );

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={{ mode: "hug", maxWidthPx: DIALOG_MAX_WIDTH_PX }}
    >
      <div
        className="relative flex h-full w-full flex-col gap-6 p-8"
        data-testid="create-project-type-dialog"
      >
        <div className="absolute right-4 top-4">
          <CloseButton onPress={() => onOpenChange(false)} />
        </div>

        <Text component="h4" variant="xl" weight="semibold">
          {t("script_project.create_dialog_title.label")}
        </Text>

        {destinations.length > 0 && (
          <div className="flex flex-col gap-2">
            <Text variant="sm" weight="semibold">
              {t("script_project.create_destination.label")}
            </Text>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {destinations.map((target) => (
                <AriaButton
                  key={target}
                  onPress={() => onCreationTargetChange(target)}
                  isDisabled={
                    isCreatingProject || isCheckingCreationAvailability
                  }
                  data-testid={`create-project-destination-${target}`}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left outline-hidden",
                    target === creationTarget
                      ? "border-glyph-action-main bg-element-primary-active"
                      : "border-element-primary bg-surface-primary data-[hovered]:bg-element-primary-active"
                  )}
                >
                  <Text variant="sm" weight="semibold">
                    {t(`script_project.create_destination_${target}.label`)}
                  </Text>
                  <Text variant="xs" color="glyph-secondary">
                    {t(
                      `script_project.create_destination_${target}.description`
                    )}
                  </Text>
                </AriaButton>
              ))}
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {choices.map((choice) => (
            <AriaButton
              key={choice.id}
              isDisabled={isCreatingProject || isCheckingCreationAvailability}
              onPress={choice.onPress}
              data-testid={`create-project-choice-${choice.id}`}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-element-primary bg-surface-primary p-5 text-left outline-hidden data-[hovered]:bg-element-primary-active data-[focus-visible]:border-glyph-action-main data-[disabled]:opacity-50"
            >
              <Text variant="lg" weight="semibold">
                {choice.label}
              </Text>
              <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
                {choice.description}
              </Text>
            </AriaButton>
          ))}
        </div>
      </div>
    </OverlayDialog>
  );
};
