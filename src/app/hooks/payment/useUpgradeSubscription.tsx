import { useChangeSubscription } from "@hooks/payment/useChangeSubscription";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { LatestSubscription } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
export const useUpgradeSubscription = (
  currentSubscription: LatestSubscription | undefined,
  targetSubscription: PriceOption
) => {
  const { mutate: changeSubscription } = useChangeSubscription();
  const handleUpgrade = () => {
    if (!currentSubscription?.id) return;

    const planName = targetSubscription.features?.title;
    if (planName) {
      trackingUtils.paymentActions.buyPlanClick(planName);
    }

    changeSubscription({
      subscriptionId: currentSubscription.id,
      priceId: targetSubscription.id
    });
  };
  return {
    handleUpgrade
  };
};
