import { SubscriptionType } from "@schemas/balance";
import { useTranslation } from "react-i18next";

import { ConfirmationModal } from "../../../ConfirmationModal";
import { getPlanName } from "../getPlanName";

interface Props {
  currentPlan?: SubscriptionType;
  expirationDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelSubscriptionModal: React.FC<Props> = ({
  currentPlan,
  isOpen,
  onClose,
  onConfirm,
  expirationDate
}) => {
  const { t } = useTranslation();

  const currentPlanName = getPlanName(currentPlan, t);

  const description = t(
    "notifications.subscription_will_remain_active_until.description",
    { currentPlan: currentPlanName, expirationDate }
  );

  return (
    <ConfirmationModal
      confirmButtonText={t("actions.unsubscribe_me.label")}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
