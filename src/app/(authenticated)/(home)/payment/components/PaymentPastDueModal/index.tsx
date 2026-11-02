/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { handlePastDuePayment } from "@home/payment/components/helpers/handlePastDue";
import {
  markPastDueModalShownThisSession,
  wasPastDueModalShownBeforeThisPageLoad
} from "@home/payment/components/helpers/pastDueModalShownThisSession";
import { usePortalSession } from "@hooks/payment/usePortalSession";
import { usePastDueDismissed } from "@hooks/userLocalStorage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { openExternalUrl } from "@/platform/cloudAccount";

export const PaymentPastDueModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    isSubscriptionPastDue,
    isSubscriptionExpired,
    subscriptionExpirationDate
  } = useCurrentSubscription();

  const { pastDueDismissed, setPastDueDismissed } = usePastDueDismissed();
  const { mutate: createPortalSession } = usePortalSession();
  const router = useRouter();

  const [isClosedByUser, setIsClosedByUser] = useState(false);

  const isPastDueModalDueToBeShown =
    isSubscriptionPastDue &&
    !pastDueDismissed &&
    !wasPastDueModalShownBeforeThisPageLoad();

  const isOpen = isPastDueModalDueToBeShown && !isClosedByUser;

  useEffect(() => {
    if (!isPastDueModalDueToBeShown) return;
    markPastDueModalShownThisSession();
  }, [isPastDueModalDueToBeShown]);

  const handleClose = () => {
    setIsClosedByUser(true);
  };

  const handleConfirm = () => {
    handlePastDuePayment({
      createPortalSession,
      // A Stripe URL: the real browser, not this window.
      onRedirect: (url) => openExternalUrl(url),
      onError: (error) => {
        console.error("Failed to handle past due payment:", error);
      }
    });
    handleClose();
  };

  const handleDismiss = () => {
    setPastDueDismissed(true);
    handleClose();
  };

  return (
    <Modal
      alertIcon="⚠️"
      centeredTitle
      contentClassName="pb-8"
      onClose={handleClose}
      open={isOpen}
      title={t("notifications.we_were_unable_to_charge_the_card.description")}
      width="sm"
      unlimitedTitleHeight
    >
      <div className="flex flex-col items-center gap-2">
        <Text align="center" color="glyph-primary" select="none" variant="sm">
          {`${t(
            isSubscriptionExpired
              ? "notifications.unfortunately_we_were_unable_to_charge_the_card_expired.description"
              : "notifications.unfortunately_we_were_unable_to_charge_the_card.description"
          )} ${subscriptionExpirationDate}.`}
        </Text>
        <div className="flex items-center justify-center gap-4 mt-2">
          <MainButton
            variant="outlined"
            colorScheme="danger"
            onPress={handleConfirm}
          >
            {t("actions.update_billing_info.label")}
          </MainButton>
          <MainButton
            variant="outlined"
            colorScheme="onColor"
            onPress={handleDismiss}
          >
            {t("actions.its_fine.label")}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
