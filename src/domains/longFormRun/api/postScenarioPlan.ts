import {
  CreateScenarioPlanRequest,
  ScenarioPlanCreated,
  ScenarioPlanCreatedSchema
} from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const postScenarioPlan = async (
  data: CreateScenarioPlanRequest
): Promise<ScenarioPlanCreated> => {
  const response = await backendApiClient.post(
    "/agent/plans/from_scenario",
    data
  );
  return ScenarioPlanCreatedSchema.parse(response.data);
};
