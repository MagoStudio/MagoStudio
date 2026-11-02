import { Badge } from "@components/Badge";
import { Plan } from "@schemas/plan";
import { useTranslation } from "react-i18next";

import { PlanSettingsField } from "./PlanSettingsField";

interface PlanSettingsSummaryProps {
  inputData: NonNullable<Plan["input_data"]>;
}

export const PlanSettingsSummary: React.FC<PlanSettingsSummaryProps> = ({
  inputData
}) => {
  const { t } = useTranslation();
  const img2img = inputData.img2img_settings;
  const video = inputData.video_settings;
  const flags = [
    inputData.sequential_shots && "plan.sequential_shots.label",
    inputData.label_style_refs && "plan.label_style_refs.label",
    inputData.label_cross_shot_refs && "plan.label_cross_shot_refs.label",
    inputData.cross_shot_metrics && "plan.cross_shot_metrics.label"
  ].filter((key): key is string => typeof key === "string");

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-surface-bg-100">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {img2img?.render_model && (
          <PlanSettingsField
            label={t("plan.img2img_settings.label")}
            value={img2img.render_model}
          />
        )}
        {video?.engine && (
          <PlanSettingsField
            label={t("plan.video_settings.label")}
            value={video.engine}
          />
        )}
      </div>

      {img2img?.prompt && (
        <PlanSettingsField
          label={t("plan.prompt.label")}
          value={img2img.prompt}
        />
      )}

      {flags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {flags.map((key) => (
            <Badge key={key} glyphColor="glyph-secondary">
              {t(key)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
