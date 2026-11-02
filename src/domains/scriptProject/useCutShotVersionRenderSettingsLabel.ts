import { CutShotVersion } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { describeCutShotVersionRenderSettings } from "./utils/describeCutShotVersionRenderSettings";

export const useCutShotVersionRenderSettingsLabel = (
  version: Pick<CutShotVersion, "render_spec">
): string | undefined => {
  const { t } = useTranslation();
  const { engineLabelKey, qualityLabel } =
    describeCutShotVersionRenderSettings(version);
  const renderSettingsParts = [
    engineLabelKey ? t(engineLabelKey) : undefined,
    qualityLabel
  ].filter((part) => part !== undefined);
  return renderSettingsParts.length
    ? renderSettingsParts.join(" · ")
    : undefined;
};
