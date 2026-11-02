import { SubscriptionType } from "@schemas/balance";
import { useTranslation } from "react-i18next";

import { ConfirmationModal } from "../../../ConfirmationModal";
import { getPlanName } from "../getPlanName";

import { getDowngradeButtonText } from "./getDowngradeButtonText";

interface DowngradeSubscriptionModalProps {
  currentPlan?: SubscriptionType;
  expirationDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetPlan?: SubscriptionType;
}

export const DowngradeSubscriptionModal: React.FC<
  DowngradeSubscriptionModalProps
> = ({
  currentPlan,
  expirationDate,
  isOpen,
  onClose,
  onConfirm,
  targetPlan
}) => {
  const { t } = useTranslation();

  const description = t("payment.downgrade_confirmation.description", {
    currentPlan: getPlanName(currentPlan, t),
    expirationDate,
    targetPlan: getPlanName(targetPlan, t)
  });

  const confirmButtonText = getDowngradeButtonText(targetPlan, t);

  return (
    <ConfirmationModal
      confirmButtonText={confirmButtonText}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
