import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

export const OnboardingUseThisHint: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2">
      <div className="relative rounded bg-element-warning p-3">
        <div className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[1px] bg-element-warning" />
        <Text
          variant="sm"
          color="glyph-invert-main"
          className="relative whitespace-nowrap"
        >
          {t("titles.onboarding_use_this_hint.label")}
        </Text>
      </div>
    </div>
  );
};
