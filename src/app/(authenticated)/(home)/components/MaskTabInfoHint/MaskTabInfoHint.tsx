import { InfoBlock } from "@components/InfoBlock";
import { useDismissibleHint } from "@home/components/hooks/useDismissibleHint";
import { useTranslation } from "react-i18next";

export const MaskTabInfoHint: React.FC = () => {
  const { t } = useTranslation();
  const { isDismissed, dismiss, isUserReady } =
    useDismissibleHint("mask-tab-hint");

  if (!isUserReady || isDismissed) return null;

  return (
    <InfoBlock variant="info" canClose onClose={dismiss}>
      {t("masking.mask_tab.info_hint.description")}
    </InfoBlock>
  );
};
