import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

interface LongFormShotCardFailureProps {
  className?: string;
}

export const LongFormShotCardFailure: React.FC<
  LongFormShotCardFailureProps
> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="long-form-shot-card-failure"
      className={cn(
        "flex flex-col items-center justify-center gap-0 rounded bg-element-on-image",
        className
      )}
    >
      <Icon iconSet="24" iconName="warning" className="text-glyph-error" />
      <Text
        component="span"
        variant="2xs"
        color="glyph-error"
        align="center"
        className="leading-4"
      >
        {t("longForm.shotState.failed.label")}
      </Text>
    </div>
  );
};
