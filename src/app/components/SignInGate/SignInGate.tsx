/* oxlint-disable custom-react/no-use-effect -- Clerk owns the sign-in result, so persisting the chosen mode is external sync */
import {
  consumeLocalSetupWizardRequest,
  requestLocalSetupWizardOnNextLaunch
} from "@app/components/LocalSetupWizard/localSetupWizardHandoff";
import { Text } from "@components/Text";
import { readAppMode, SignIn, SignUp, useAuth } from "@platform/identity";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

/**
 * First screen of a fresh install: Clerk's own sign-in, with skipping offered
 * underneath it.
 *
 * Shown only when the stored mode is "unchosen". Skipping is a first-class
 * outcome, not a dead end: it persists offline mode straight away and asks for
 * the local setup wizard, so the window rebuilds into a working app with the
 * wizard over it rather than into the wizard alone. Neither outcome is
 * permanent; the mode can be changed later from settings.
 */

export const SignInGate = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const hasRequestedModeRef = useRef(false);
  const [isEnteringOfflineApp, setIsEnteringOfflineApp] = useState(false);

  // The main process persists the choice and rebuilds the window, so there is
  // no success path to handle here — this view goes away with the window.
  useEffect(() => {
    if (!isSignedIn || hasRequestedModeRef.current) return;
    hasRequestedModeRef.current = true;
    void window.mago?.account?.chooseMode("cloud").catch(() => {
      hasRequestedModeRef.current = false;
    });
  }, [isSignedIn]);

  const skipToLocalSetup = () => {
    if (hasRequestedModeRef.current) return;
    hasRequestedModeRef.current = true;
    setIsEnteringOfflineApp(true);
    requestLocalSetupWizardOnNextLaunch();
    void window.mago?.account?.chooseMode("offline").catch(() => {
      hasRequestedModeRef.current = false;
      setIsEnteringOfflineApp(false);
      consumeLocalSetupWizardRequest();
    });
  };

  const isSignUpRoute = pathname?.startsWith("/sign-up") ?? false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-auto bg-[url('/assets/images/preview-background.png')] bg-cover bg-no-repeat p-4">
      <div className="overflow-hidden rounded-3xl bg-surface-primary text-glyph-primary backdrop-blur-xl">
        {isSignUpRoute ? (
          <SignUp signInUrl="/sign-in" />
        ) : (
          <SignIn signUpUrl="/sign-up" />
        )}
      </div>

      <AriaLink
        className="cursor-pointer data-[disabled]:cursor-default"
        isDisabled={isEnteringOfflineApp}
        onPress={skipToLocalSetup}
      >
        <Text
          component="span"
          variant="sm"
          color="glyph-secondary"
          decoration="underline"
        >
          {t("signInGate.skip", { defaultValue: "Skip" })}
        </Text>
      </AriaLink>
    </div>
  );
};

/** Renders the gate in place of the app until the choice has been made. */
export const SignInGateBoundary = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [mode] = useState(readAppMode);
  if (mode !== "unchosen") return children;
  return <SignInGate />;
};
