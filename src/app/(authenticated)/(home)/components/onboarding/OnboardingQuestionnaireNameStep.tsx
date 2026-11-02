import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const nameSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1)
});

export type QuestionnaireNameValues = z.infer<typeof nameSchema>;

interface OnboardingQuestionnaireNameStepProps {
  defaultFirstName: string;
  defaultLastName: string;
  onContinue: (values: QuestionnaireNameValues) => void;
}

export const OnboardingQuestionnaireNameStep: React.FC<
  OnboardingQuestionnaireNameStepProps
> = ({ defaultFirstName, defaultLastName, onContinue }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, control } = useForm<QuestionnaireNameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { firstName: defaultFirstName, lastName: defaultLastName }
  });

  const [firstName, lastName] = useWatch({
    control,
    name: ["firstName", "lastName"]
  });
  const canContinue = Boolean(firstName?.trim() && lastName?.trim());

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onContinue)}>
      <Text
        component="h1"
        weight="normal"
        color="glyph-primary"
        align="center"
        className="font-syne text-[40px] leading-[48px] tracking-[-0.4px]"
      >
        {t("titles.onboarding_questionnaire.name.title")}
      </Text>
      <div className="flex flex-col gap-3">
        <Input
          aria-label={t("titles.onboarding_questionnaire.name.first_name")}
          placeholder={t("titles.onboarding_questionnaire.name.first_name")}
          {...register("firstName")}
        />
        <Input
          aria-label={t("titles.onboarding_questionnaire.name.last_name")}
          placeholder={t("titles.onboarding_questionnaire.name.last_name")}
          {...register("lastName")}
        />
      </div>
      <MainButton type="submit" isDisabled={!canContinue} fullWidth>
        {t("actions.continue.label")}
      </MainButton>
    </form>
  );
};
