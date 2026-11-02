import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { QuestionnaireOption } from "@domains/onboarding/questionnaire";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FreeTextConfig<T extends string> {
  value: T;
  placeholder: string;
  onSubmit: (text: string) => void;
}

interface OnboardingQuestionnaireChoiceStepProps<T extends string> {
  title: string;
  subtitle?: string;
  options: QuestionnaireOption<T>[];
  selectedValue?: T;
  isSubmitting?: boolean;
  submittingValue?: T;
  onSelect: (value: T) => void;
  freeText?: FreeTextConfig<T>;
}

export const OnboardingQuestionnaireChoiceStep = <T extends string>({
  title,
  subtitle,
  options,
  selectedValue,
  isSubmitting,
  submittingValue,
  onSelect,
  freeText
}: OnboardingQuestionnaireChoiceStepProps<T>) => {
  const { t } = useTranslation();
  const [isEditingFreeText, setIsEditingFreeText] = useState(false);
  const [freeTextInput, setFreeTextInput] = useState("");

  const canSubmitFreeText = freeTextInput.trim().length > 0;

  const submitFreeText = () => {
    if (!canSubmitFreeText) return;
    freeText?.onSubmit(freeTextInput.trim());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Text
          component="h1"
          weight="normal"
          color="glyph-primary"
          align="center"
          className="font-syne text-[40px] leading-[48px] tracking-[-0.4px]"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            component="p"
            weight="normal"
            color="glyph-tertiary"
            align="center"
            variant="sm"
          >
            {subtitle}
          </Text>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isFreeTextOption = freeText?.value === option.value;

          if (isFreeTextOption && isEditingFreeText) {
            return (
              <Input
                key={option.value}
                autoFocus
                aria-label={freeText.placeholder}
                placeholder={freeText.placeholder}
                value={freeTextInput}
                disabled={isSubmitting}
                onChange={(event) => setFreeTextInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitFreeText();
                  }
                }}
              />
            );
          }

          return (
            <MainButton
              key={option.value}
              className="justify-start"
              colorScheme={
                selectedValue === option.value ? "primary" : "secondary"
              }
              aria-pressed={selectedValue === option.value}
              fullWidth
              isDisabled={isSubmitting}
              loading={submittingValue === option.value}
              onPress={() =>
                isFreeTextOption
                  ? setIsEditingFreeText(true)
                  : onSelect(option.value)
              }
            >
              {t(option.labelKey)}
            </MainButton>
          );
        })}
      </div>
      {isEditingFreeText && (
        <MainButton
          fullWidth
          isDisabled={isSubmitting || !canSubmitFreeText}
          onPress={submitFreeText}
        >
          {t("actions.continue.label")}
        </MainButton>
      )}
    </div>
  );
};
