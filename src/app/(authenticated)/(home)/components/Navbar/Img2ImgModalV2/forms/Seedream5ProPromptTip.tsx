import { InfoBlock } from "@components/InfoBlock";
import { useDismissibleHint } from "@home/components/hooks/useDismissibleHint";
import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Seedream5ProType } from "../schemas/seedream5Pro.schema";

export const Seedream5ProPromptTip: React.FC = () => {
  const { t } = useTranslation();
  const { isDismissed, dismiss, isUserReady } = useDismissibleHint(
    "seedream-5-pro-red-area-prompt-tip"
  );

  const maskLayerDataUrl = useWatch<Seedream5ProType, "maskLayerDataUrl">({
    name: "maskLayerDataUrl"
  });
  const hasSavedMask = Boolean(maskLayerDataUrl);

  if (!isUserReady || isDismissed || !hasSavedMask) return null;

  return (
    <InfoBlock variant="info" canClose onClose={dismiss}>
      {t("img2imgForms.draw_mask.red_area_tip")}
    </InfoBlock>
  );
};
