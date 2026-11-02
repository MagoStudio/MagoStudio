import { aspectRatios } from "@config/constants";
import { describe, expect, it } from "vitest";

import { buildScenarioRunRequest } from "./buildScenarioRunRequest";

describe("buildScenarioRunRequest", () => {
  it("sends the trimmed script and the fixed vertical output size, and nothing else", () => {
    const request = buildScenarioRunRequest("  A hero walks into a bar.  ");

    expect(request).toEqual({
      script: "A hero walks into a bar.",
      output_size: aspectRatios.vertical
    });
  });

  it("sends no project id, shot count, shot length or engine", () => {
    const request = buildScenarioRunRequest("A script.");

    expect(request).not.toHaveProperty("project_id");
    expect(request).not.toHaveProperty("max_shots");
    expect(request).not.toHaveProperty("shot_duration_s");
    expect(request).not.toHaveProperty("engine");
  });

  it("rejects an empty script", () => {
    expect(() => buildScenarioRunRequest("   ")).toThrow();
  });
});
