import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

export const PaymentHint: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center gap-2 p-3 w-76 rounded-lg bg-surface-bg-200 backdrop-blur-md shadow-glassmorphism">
      <div className="h-12 w-12">
        <img alt="" src="/payment_cat.png" />
      </div>
      <Text
        color="glyph-primary-on-pic"
        lineHeight="relaxed"
        select="none"
        variant="xs"
        whiteSpace="pre-line"
      >
        {t("hints.privacy_notice")}
      </Text>
    </div>
  );
};
