import { RenderMetrics, RenderMetricsAxisName } from "./renderMetricsTypes";

/** Both evaluators clamp every score to 0-10, as the backend does. Shown beside each score so "7.8" is not a mystery. */
export const METRICS_MAX_SCORE = 10;

export type RenderMetricsVerdict =
  | "pass"
  | "fail"
  | "pending"
  | "error"
  | "none";

export const getRenderMetricsVerdict = (
  metrics: RenderMetrics | undefined
): RenderMetricsVerdict => {
  if (!metrics) return "none";
  if (metrics.status === "PENDING") return "pending";
  /* A scoring run that broke is not a render that scored badly, and hiding it made a whole
   * plan of unscored shots look like a frontend bug. It gets its own muted state. */
  if (metrics.status !== "COMPLETED") return "error";
  return metrics.hasEvaluatorPassed ? "pass" : "fail";
};

export type RenderMetricsAxis = { labelKey: string; score: number };

const AXIS_LABEL_KEY: Record<RenderMetricsAxisName, string> = {
  style: "script_project.metric_style.label",
  content: "script_project.metric_content.label",
  identity: "script_project.metric_identity.label",
  lighting: "script_project.metric_lighting.label",
  quality: "script_project.metric_quality.label",
  temporalStyle: "script_project.metric_temporal_style.label",
  temporalIdentity: "script_project.metric_temporal_identity.label",
  promptAdherence: "script_project.metric_prompt_adherence.label",
  coherence: "script_project.metric_coherence.label",
  usability: "script_project.metric_usability.label"
};

/** The per-axis scores that came back, in a fixed order so the tooltip does not reshuffle. */
export const listRenderMetricsAxes = (
  metrics: RenderMetrics | undefined
): RenderMetricsAxis[] =>
  Object.entries(AXIS_LABEL_KEY).flatMap(([axisName, labelKey]) => {
    const score = metrics?.scoreByAxis[axisName as RenderMetricsAxisName];
    return typeof score === "number" ? [{ labelKey, score }] : [];
  });
