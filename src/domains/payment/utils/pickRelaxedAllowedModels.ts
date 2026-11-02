import { SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";

export function pickRelaxedAllowedModels(
  subscriptionCards: PriceOption[] | undefined,
  subscriptionType: SubscriptionType | undefined,
  snapshotList: string[]
): string[] {
  if (!subscriptionType) return snapshotList;

  const planCard = subscriptionCards?.find(
    (card) => card.features?.title === subscriptionType
  );

  return planCard?.features?.relaxed_allowed_models ?? snapshotList;
}
