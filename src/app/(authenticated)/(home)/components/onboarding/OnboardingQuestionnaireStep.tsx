import {
  PROFESSION_OPTIONS,
  Profession,
  REFERRAL_SOURCE_OPTIONS,
  ReferralSource
} from "@domains/onboarding/questionnaire";
import { useSubmitOnboardingQuestionnaire } from "@domains/onboarding/useSubmitOnboardingQuestionnaire";
import { useUser } from "@platform/identity";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { OnboardingQuestionnaireChoiceStep } from "./OnboardingQuestionnaireChoiceStep";
import {
  OnboardingQuestionnaireNameStep,
  QuestionnaireNameValues
} from "./OnboardingQuestionnaireNameStep";

type SubStep = "name" | "profession" | "referral";

export const OnboardingQuestionnaireStep: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();
  const { submitQuestionnaire } = useSubmitOnboardingQuestionnaire();
  const { showToast } = useToast();

  const [subStep, setSubStep] = useState<SubStep>("name");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [profession, setProfession] = useState<Profession | undefined>();
  const [professionOther, setProfessionOther] = useState<string | undefined>();
  const [referralSource, setReferralSource] = useState<
    ReferralSource | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) return null;

  const handleName = (values: QuestionnaireNameValues) => {
    setFirstName(values.firstName);
    setLastName(values.lastName);
    setSubStep("profession");
  };

  const handleProfession = (value: Profession) => {
    setProfession(value);
    setProfessionOther(undefined);
    setSubStep("referral");
  };

  const handleProfessionOther = (text: string) => {
    setProfession("other");
    setProfessionOther(text);
    setSubStep("referral");
  };

  const handleReferral = async (referral: ReferralSource) => {
    setReferralSource(referral);
    if (!profession) return;

    setIsSubmitting(true);
    try {
      await submitQuestionnaire({
        firstName,
        lastName,
        profession,
        professionOther,
        referralSource: referral
      });
    } catch (error) {
      console.error("Failed to save onboarding questionnaire:", error);
      showToast({
        message: t("notifications.questionnaire_save_failed.label")
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full overflow-y-auto py-[50px]">
      <div className="my-auto flex w-full max-w-[520px] flex-col gap-6 rounded-2xl bg-surface-secondary px-8 py-10">
        {subStep === "name" && (
          <OnboardingQuestionnaireNameStep
            defaultFirstName={firstName}
            defaultLastName={lastName}
            onContinue={handleName}
          />
        )}
        {subStep === "profession" && (
          <OnboardingQuestionnaireChoiceStep
            title={t("titles.onboarding_questionnaire.profession.title")}
            subtitle={t("titles.onboarding_questionnaire.profession.subtitle")}
            options={PROFESSION_OPTIONS}
            selectedValue={profession}
            onSelect={handleProfession}
            freeText={{
              value: "other",
              placeholder: t(
                "titles.onboarding_questionnaire.profession.other_placeholder"
              ),
              onSubmit: handleProfessionOther
            }}
          />
        )}
        {subStep === "referral" && (
          <OnboardingQuestionnaireChoiceStep
            title={t("titles.onboarding_questionnaire.referral_source.title")}
            options={REFERRAL_SOURCE_OPTIONS}
            selectedValue={referralSource}
            isSubmitting={isSubmitting}
            submittingValue={isSubmitting ? referralSource : undefined}
            onSelect={handleReferral}
          />
        )}
      </div>
    </div>
  );
};
