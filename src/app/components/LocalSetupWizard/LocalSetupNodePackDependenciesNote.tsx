import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { NodePackDependenciesOutcome } from "../../../../desktop/shared/contracts";

export const LocalSetupNodePackDependenciesNote = ({
  nodePackDependencies
}: {
  nodePackDependencies: NodePackDependenciesOutcome;
}) => {
  const { t } = useTranslation();

  if (nodePackDependencies.outcome !== "manual")
    return (
      <Text variant="xs" color="success">
        {t(
          nodePackDependencies.outcome === "installed"
            ? "localSetup.nodePackDependencies.installed"
            : "localSetup.nodePackDependencies.noRequirements"
        )}
      </Text>
    );

  return (
    <div className="flex flex-col items-start gap-1">
      <Text variant="xs" color="glyph-warning">
        {t(
          nodePackDependencies.failureReason
            ? "localSetup.nodePackDependencies.failed"
            : "localSetup.nodePackDependencies.manual"
        )}
      </Text>
      {nodePackDependencies.failureReason && (
        <Text variant="xs" color="glyph-error" className="wrap-anywhere">
          {nodePackDependencies.failureReason}
        </Text>
      )}
      <Text
        variant="xs"
        color="glyph-secondary"
        className="wrap-anywhere font-mono"
      >
        {nodePackDependencies.pipCommand}
      </Text>
      <MainButton
        colorScheme="secondary"
        onPress={() =>
          void navigator.clipboard.writeText(nodePackDependencies.pipCommand)
        }
      >
        {t("localSetup.nodePackDependencies.copyCommand")}
      </MainButton>
    </div>
  );
};
