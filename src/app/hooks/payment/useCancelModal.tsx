import { useState } from "react";
interface UseCancelModalReturn {
  isOpen: boolean;
  subscriptionId: string | null;
  openModal: (subscriptionId: string) => void;
  closeModal: () => void;
  confirmCancel: (onCancel: (subscriptionId: string) => void) => void;
}

export const useCancelModal = (): UseCancelModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const openModal = (subscriptionId: string) => {
    setSubscriptionId(subscriptionId);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setSubscriptionId(null);
  };
  const confirmCancel = (onCancel: (subscriptionId: string) => void) => {
    if (subscriptionId) {
      onCancel(subscriptionId);
    }
    closeModal();
  };
  return {
    isOpen,
    subscriptionId,
    openModal,
    closeModal,
    confirmCancel
  };
};
