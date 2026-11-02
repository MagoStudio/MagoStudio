import { Balance } from "@schemas/balance";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchBalance = async (): Promise<Balance> => {
  const response = await backendApiClient.get<Balance>("/balance");

  return response.data;
};
