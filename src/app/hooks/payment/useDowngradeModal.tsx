import { SubscriptionType } from "@schemas/balance";
import { useState } from "react";
interface UseDowngradeModalReturn {
  isOpen: boolean;
  targetPlan: SubscriptionType | null;
  targetPriceId: string | null;
  openModal: (plan: SubscriptionType, priceId?: string | null) => void;
  closeModal: () => void;
  confirmDowngrade: (
    onFreeDowngrade: () => void,
    onPaidDowngrade: (priceId: string) => void
  ) => void;
}

export const useDowngradeModal = (): UseDowngradeModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<SubscriptionType | null>(null);
  const [targetPriceId, setTargetPriceId] = useState<string | null>(null);
  const openModal = (plan: SubscriptionType, priceId: string | null = null) => {
    setTargetPlan(plan);
    setTargetPriceId(priceId);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setTargetPlan(null);
    setTargetPriceId(null);
  };
  const confirmDowngrade = (
    onFreeDowngrade: () => void,
    onPaidDowngrade: (priceId: string) => void
  ) => {
    if (targetPlan === SubscriptionType.FREE) {
      onFreeDowngrade();
      closeModal();
      return;
    }

    if (targetPriceId) {
      onPaidDowngrade(targetPriceId);
      closeModal();
      return;
    }

    closeModal();
  };
  return {
    isOpen,
    targetPlan,
    targetPriceId,
    openModal,
    closeModal,
    confirmDowngrade
  };
};
