import { aspectRatios } from "@config/constants";
import { CreateScenarioPlanRequest } from "@schemas/plan";

export const buildScenarioRunRequest = (
  script: string
): CreateScenarioPlanRequest => {
  const trimmedScript = script.trim();
  if (!trimmedScript) {
    throw new Error("A script is required to start a long-form run.");
  }

  return {
    script: trimmedScript,
    output_size: aspectRatios.vertical
  };
};
