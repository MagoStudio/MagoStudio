import { useOpenLocalSetupWizard } from "@app/components/LocalSetupWizard/hooks/useOpenLocalSetupWizard";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { identityMode, useAuth } from "@platform/identity";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export const RunLocallyCard = () => {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth();
  // Offline identity represents a local user, not a signed-in cloud account.
  const isLoggedOut = identityMode === "offline" || (isLoaded && !isSignedIn);
  const openLocalSetupWizard = useOpenLocalSetupWizard();

  const install = useQuery({
    queryKey: ["starter-installer"],
    queryFn: () => window.mago.localSetup.installerStatus(),
    enabled:
      isLoggedOut &&
      typeof window !== "undefined" &&
      Boolean(window.mago?.localSetup),
    refetchInterval: 5000
  });

  if (
    !isLoggedOut ||
    !install.data ||
    install.data.hasCompletedInstall ||
    install.data.phase === "done"
  )
    return null;

  return (
    <div className="relative w-full rounded-3xl bg-element-additional-active-transparent text-glyph-primary shadow-glassmorphism backdrop-blur-md">
      <div className="flex flex-col gap-3 p-8">
        <Text component="h4">
          {t("runLocally.title", {
            defaultValue: "Run Mago locally for free"
          })}
        </Text>

        <Text variant="sm" color="glyph-secondary">
          {t("runLocally.description", {
            defaultValue:
              "Render on your own graphics card instead of spending credits. Mago installs its own ComfyUI engine and a starter set of models, and your projects stay on this computer."
          })}
        </Text>

        <div className="mt-2 self-start">
          <MainButton
            colorScheme="primary"
            onPress={() => openLocalSetupWizard()}
          >
            {t("runLocally.start", {
              defaultValue: "Set up local rendering"
            })}
          </MainButton>
        </div>
      </div>
    </div>
  );
};
