type MetricChipKind = "pass" | "fail" | "unscored";

export interface PlanMetric {
  kind: MetricChipKind;
  details: Record<string, unknown>;
}

export function getMetricChip(
  metrics: unknown,
  passKey: "pass" | "vid_pass"
): PlanMetric | undefined {
  if (!metrics || typeof metrics !== "object") return undefined;
  const details = metrics as Record<string, unknown>;

  const evalCallFailed = details.status === "FAILED";
  if (evalCallFailed) return { kind: "unscored", details };

  const passed = details[passKey];
  if (details.status === "COMPLETED" || typeof passed === "boolean") {
    return { kind: passed === true ? "pass" : "fail", details };
  }

  return undefined;
}
