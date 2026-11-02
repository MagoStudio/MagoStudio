import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { pickRelaxedAllowedModels } from "@domains/payment/utils/pickRelaxedAllowedModels";
import { usePrices } from "@hooks/payment/usePrices";

export function useRelaxedAllowedModels(): string[] {
  const { data: prices } = usePrices();
  const { subscriptionType, relaxedAllowedModels } = useCurrentSubscription();

  return pickRelaxedAllowedModels(
    prices?.subscription,
    subscriptionType,
    relaxedAllowedModels
  );
}
