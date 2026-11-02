import { describe, expect, it } from "vitest";

import { RenderMetrics } from "./renderMetricsTypes";
import {
  getRenderMetricsVerdict,
  listRenderMetricsAxes
} from "./summariseRenderMetrics";

const metricsWith = (patch: Partial<RenderMetrics>): RenderMetrics => ({
  status: "COMPLETED",
  evalMode: null,
  score: null,
  hasEvaluatorPassed: null,
  scoreByAxis: {},
  issues: [],
  nextPrompt: null,
  evaluationError: null,
  ...patch
});

describe("getRenderMetricsVerdict", () => {
  it("passes when the evaluator passed it", () => {
    expect(
      getRenderMetricsVerdict(metricsWith({ hasEvaluatorPassed: true }))
    ).toBe("pass");
  });

  it("fails when the evaluator failed it", () => {
    expect(
      getRenderMetricsVerdict(metricsWith({ hasEvaluatorPassed: false }))
    ).toBe("fail");
  });

  it("is pending while the evaluation runs, not a failure", () => {
    expect(getRenderMetricsVerdict(metricsWith({ status: "PENDING" }))).toBe(
      "pending"
    );
  });

  it("reports a broken evaluation rather than hiding it", () => {
    expect(getRenderMetricsVerdict(metricsWith({ status: "FAILED" }))).toBe(
      "error"
    );
  });

  it("is none when there are no metrics at all", () => {
    expect(getRenderMetricsVerdict(undefined)).toBe("none");
  });
});

describe("listRenderMetricsAxes", () => {
  it("lists only the axes that came back, in a stable order", () => {
    const axes = listRenderMetricsAxes(
      metricsWith({ scoreByAxis: { quality: 7, style: 8 } })
    );

    expect(axes.map((axis) => axis.labelKey)).toEqual([
      "script_project.metric_style.label",
      "script_project.metric_quality.label"
    ]);
    expect(axes[0]?.score).toBe(8);
  });

  it("lists the video-only temporal axes when an image evaluation would not have them", () => {
    const axes = listRenderMetricsAxes(
      metricsWith({ scoreByAxis: { style: 8, temporalIdentity: 6 } })
    );

    expect(axes.map((axis) => axis.labelKey)).toEqual([
      "script_project.metric_style.label",
      "script_project.metric_temporal_identity.label"
    ]);
  });

  it("is empty when nothing was scored", () => {
    expect(listRenderMetricsAxes(undefined)).toEqual([]);
    expect(listRenderMetricsAxes(metricsWith({ status: "PENDING" }))).toEqual(
      []
    );
  });
});
