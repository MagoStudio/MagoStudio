import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

export const LocalSetupWizardHeader = ({
  stepNames,
  stepNumber,
  onCollapse,
  onSkipStep,
  skipStepLabel,
  onBack,
  isBackDisabled = false
}: {
  stepNames: string[];
  stepNumber: number;
  onCollapse?: () => void;
  onSkipStep?: () => void;
  skipStepLabel?: string;
  onBack?: () => void;
  isBackDisabled?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text component="span" variant="sm" color="glyph-tertiary">
          {t("localSetup.stepCounter", {
            defaultValue: "Step {{current}} of {{total}} · {{name}}",
            current: stepNumber,
            total: stepNames.length,
            name: stepNames[stepNumber - 1]
          })}
        </Text>
        <div className="flex items-center gap-1">
          {onBack && (
            <GhostButton
              size="sm"
              colorScheme="stroke"
              onPress={onBack}
              isDisabled={isBackDisabled}
            >
              {t("localSetup.back")}
            </GhostButton>
          )}
          {onSkipStep ? (
            <GhostButton size="sm" colorScheme="stroke" onPress={onSkipStep}>
              {skipStepLabel}
            </GhostButton>
          ) : null}

          {onCollapse ? (
            <IconActionButton
              size="sm"
              variant="transparent"
              aria-label={t("localSetup.collapse", {
                defaultValue: "Collapse setup"
              })}
              icon={<Icon iconSet="16" iconName="chevron-down" />}
              onPress={onCollapse}
            />
          ) : null}
        </div>
      </div>

      <div className="flex gap-1">
        {stepNames.map((stepName, index) => (
          <div
            key={stepName}
            className={cn(
              "h-1 flex-1 rounded-sm",
              index < stepNumber
                ? "bg-element-tertiary-active"
                : "bg-element-on-image"
            )}
          />
        ))}
      </div>
    </div>
  );
};
