import { Textarea } from "@components/Textarea";
import { cn } from "@utils";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface Props {
  className?: string;
}

export const OnboardingPromptField: React.FC<Props> = ({ className }) => {
  const { register } = useFormContext();
  const { t } = useTranslation();

  return (
    <Textarea
      {...register("prompt")}
      aria-label={t("titles.onboarding_image_step.label")}
      placeholder={t("titles.onboarding_image_step.default_prompt")}
      className={cn(
        "h-32 min-h-32 resize-none placeholder:text-glyph-disabled",
        className
      )}
    />
  );
};
