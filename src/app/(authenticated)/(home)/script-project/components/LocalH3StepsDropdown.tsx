import { Dropdown } from "@components/Dropdown";
import {
  LOCAL_H3_STEP_OPTIONS,
  LocalH3Steps
} from "@domains/scriptProject/constants";
import { useTranslation } from "react-i18next";

import { resolveMiniMaxH3StepLoraSteps } from "../../../../../../desktop/shared/minimaxH3StepLoras";

const LABEL_KEY_BY_STEPS: Record<LocalH3Steps, string> = {
  2: "script_project.local_h3_steps_2.label",
  4: "script_project.local_h3_steps_4.label",
  8: "script_project.local_h3_steps_8.label"
};

type Props = {
  steps: LocalH3Steps;
  isDisabled: boolean;
  isStepLoraInstalled: (steps: LocalH3Steps) => boolean;
  onChange: (nextSteps: LocalH3Steps) => void;
};

export const LocalH3StepsDropdown: React.FC<Props> = ({
  steps,
  isDisabled,
  isStepLoraInstalled,
  onChange
}) => {
  const { t } = useTranslation();
  const items = LOCAL_H3_STEP_OPTIONS.map((optionSteps) => ({
    key: String(optionSteps),
    label: t(LABEL_KEY_BY_STEPS[optionSteps]),
    badge: isStepLoraInstalled(optionSteps)
      ? undefined
      : t("script_project.local_h3_steps_not_installed.label")
  }));

  return (
    <Dropdown
      aria-label={t("script_project.local_h3_steps_input.label")}
      isDisabled={isDisabled}
      selectedKey={String(steps)}
      items={items}
      onSelectionChange={(key) =>
        onChange(resolveMiniMaxH3StepLoraSteps(Number(key)))
      }
      className="w-52"
      popoverWidth="content"
      data-testid="script-project-local-h3-steps"
    />
  );
};
