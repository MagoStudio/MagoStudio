import { RadioPill, RadioPillOption } from "@components/RadioPill";
import {
  LOCAL_H3_BASELINE_STEPS,
  LOCAL_H3_QUALITY_STEPS,
  LocalH3Steps
} from "@domains/scriptProject/constants";
import { useTranslation } from "react-i18next";

/** The two step counts a local project offers, under the cloud's Slow/Fast
 * labels: the only MiniMax H3 control a local Shots tab shows. */
type Quality = "slow" | "fast";

const STEPS_BY_QUALITY: Record<Quality, LocalH3Steps> = {
  slow: LOCAL_H3_QUALITY_STEPS,
  fast: LOCAL_H3_BASELINE_STEPS
};

const LABEL_KEY_BY_QUALITY: Record<Quality, string> = {
  slow: "script_project.shot_render_speed_slow.label",
  fast: "script_project.shot_render_speed_fast.label"
};

const qualityOf = (steps: LocalH3Steps): Quality =>
  steps === LOCAL_H3_QUALITY_STEPS ? "slow" : "fast";

/** A stored step count from before this switch (3) reads as Fast. */
export const resolveLocalH3QualitySteps = (steps: LocalH3Steps): LocalH3Steps =>
  STEPS_BY_QUALITY[qualityOf(steps)];

type Props = {
  steps: LocalH3Steps;
  isDisabled: boolean;
  onChange: (nextSteps: LocalH3Steps) => void;
};

export const LocalH3QualitySwitch: React.FC<Props> = ({
  steps,
  isDisabled,
  onChange
}) => {
  const { t } = useTranslation();
  const options: RadioPillOption<Quality>[] = (["slow", "fast"] as const).map(
    (value) => ({
      value,
      label: t(LABEL_KEY_BY_QUALITY[value]),
      isDisabled
    })
  );

  return (
    <span data-testid="script-project-local-h3-quality">
      <RadioPill
        options={options}
        value={qualityOf(steps)}
        onChange={(nextQuality) => {
          if (nextQuality) onChange(STEPS_BY_QUALITY[nextQuality]);
        }}
        aria-label={t("script_project.shot_render_speed_input.label")}
      />
    </span>
  );
};
