import { MainButton } from "@components/MainButton";
import { useTranslation } from "react-i18next";

/**
 * Review aid for the first-run scenario.
 *
 * Clearing the stored mode and rebuilding the window is what the main process
 * already does for signing out, so the scenario restarts from its real first
 * screen rather than from a reset piece of React state.
 */

export const RestartScenarioButton = () => {
  const { t } = useTranslation();

  if (typeof window === "undefined" || !window.mago) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-tooltip">
      <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2">
        <MainButton
          size="sm"
          colorScheme="secondary"
          onPress={() => void window.mago?.account?.signOut()}
        >
          {t("restartScenario.label", { defaultValue: "Restart scenario" })}
        </MainButton>
      </div>
    </div>
  );
};
