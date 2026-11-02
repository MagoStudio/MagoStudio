import { MainButton } from "@components/MainButton";

export const LocalSetupWizardActions = ({
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  isPrimaryDisabled = false
}: {
  isPrimaryDisabled?: boolean;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) => (
  <div className="mt-auto flex gap-2">
    {secondaryLabel ? (
      <MainButton fullWidth colorScheme="secondary" onPress={onSecondaryPress}>
        {secondaryLabel}
      </MainButton>
    ) : null}

    <MainButton
      fullWidth
      colorScheme="primary"
      isDisabled={isPrimaryDisabled}
      onPress={onPrimaryPress}
    >
      {primaryLabel}
    </MainButton>
  </div>
);
