import { RadioPill, RadioPillOption } from "@components/RadioPill";
import {
  SELECTABLE_SHOT_RENDER_ENGINES,
  SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE,
  ShotRenderEngine
} from "@domains/scriptProject/constants";
import { useTranslation } from "react-i18next";

type Props = {
  shotEngine: ShotRenderEngine;
  isDisabled: boolean;
  onChange: (nextShotEngine: ShotRenderEngine) => void;
};

export const ShotRenderSpeedSwitch: React.FC<Props> = ({
  shotEngine,
  isDisabled,
  onChange
}) => {
  const { t } = useTranslation();

  const options: RadioPillOption<ShotRenderEngine>[] =
    SELECTABLE_SHOT_RENDER_ENGINES.map((engine) => ({
      value: engine,
      label: t(SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE[engine]),
      isDisabled
    }));

  return (
    <RadioPill
      options={options}
      value={shotEngine}
      onChange={(nextShotEngine) => {
        if (nextShotEngine) onChange(nextShotEngine);
      }}
      aria-label={t("script_project.shot_render_speed_input.label")}
    />
  );
};
