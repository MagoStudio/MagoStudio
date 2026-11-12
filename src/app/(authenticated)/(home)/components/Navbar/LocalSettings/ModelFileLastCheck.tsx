import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { ModelFileCheckSummary } from "../../../../../../../desktop/shared/modelSettings";

import { formatModelFileCheckTime } from "./formatModelFileCheckTime";

export const ModelFileLastCheck = ({
  latestFileCheck
}: {
  latestFileCheck: ModelFileCheckSummary | null;
}) => {
  const { t, i18n } = useTranslation();
  return (
    <Text
      variant="2xs"
      color="glyph-tertiary"
      data-testid="model-file-last-check"
    >
      {latestFileCheck
        ? t("modelSettings.lastFileCheck", {
            check: t(`modelSettings.fileCheckKinds.${latestFileCheck.kind}`),
            outcome: t(
              `modelSettings.fileCheckOutcomes.${latestFileCheck.outcome}`
            ),
            date: formatModelFileCheckTime(
              latestFileCheck.checkedAt,
              i18n.language
            )
          })
        : t("modelSettings.notCheckedYet")}
    </Text>
  );
};
