import type { LocalModelType } from "../../../../../../../desktop/shared/modelSettings";

export const localModelSettingsQueryOptions = (
  endpoint: string,
  model: LocalModelType
) => ({
  queryKey: ["local-model-settings", endpoint, model],
  queryFn: () => window.mago.models.inspect({ endpoint, model }),
  retry: false,
  staleTime: 30_000
});
