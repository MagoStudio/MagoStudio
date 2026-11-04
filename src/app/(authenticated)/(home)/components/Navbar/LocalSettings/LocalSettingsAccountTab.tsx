import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { CloudAccountBillingActions } from "../CloudAccountBillingActions";

type Props = {
  isCloudAccountActive: boolean;
  signedInEmailAddress: string | undefined;
  isSignInPending: boolean;
  signInError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigateAway: () => void;
};

export const LocalSettingsAccountTab = ({
  isCloudAccountActive,
  signedInEmailAddress,
  isSignInPending,
  signInError,
  onSignIn,
  onSignOut,
  onNavigateAway
}: Props) => {
  const { t } = useTranslation();

  if (isCloudAccountActive) {
    return (
      <>
        <div className="flex flex-col gap-3">
          <Text variant="sm" weight="bold">
            {t("localSettings.account.heading")}
          </Text>
          <div className="flex items-center gap-3">
            <Text
              component="span"
              variant="sm"
              color="glyph-primary"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-element-primary uppercase"
            >
              {(signedInEmailAddress ?? "?").charAt(0)}
            </Text>
            <Text variant="xs" color="glyph-secondary" className="break-all">
              {signedInEmailAddress ??
                t("localSettings.account.signedInFallback")}
            </Text>
          </div>
          <CloudAccountBillingActions onNavigateAway={onNavigateAway} />
        </div>
        <div className="h-px bg-glyph-stroke" aria-hidden="true" />
        <div className="flex gap-2">
          <GhostButton colorScheme="color" onPress={onSignOut}>
            {t("localSettings.account.signOut")}
          </GhostButton>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Text variant="sm" weight="bold">
        {t("localSettings.account.heading")}
      </Text>
      <Text variant="xs" color="glyph-secondary">
        {t("localSettings.account.signInPrompt")}
      </Text>
      <div className="flex gap-2">
        <GhostButton loading={isSignInPending} onPress={onSignIn}>
          {t("localSettings.account.signIn")}
        </GhostButton>
      </div>
      {signInError && (
        <Text variant="xs" color="glyph-error">
          {signInError}
        </Text>
      )}
    </div>
  );
};
