import { MainButton } from "@components/MainButton";
import { ROUTES } from "@config/constants";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { useTranslation } from "react-i18next";

interface Props {
  loading?: boolean;
  onDowngrade: () => void;
  isFreeSubscription: boolean;
  canDowngradeToFree: boolean;
  isScheduledToFree: boolean;
  scheduledStartDate?: number | null;
}

export const FreePlanButton: React.FC<Props> = ({
  loading = false,
  onDowngrade,
  isFreeSubscription,
  canDowngradeToFree,
  isScheduledToFree,
  scheduledStartDate
}) => {
  const { t } = useTranslation();
  const shallowRouter = useShallowRouter();

  if (isScheduledToFree && scheduledStartDate) {
    return (
      <MainButton variant="outlined" colorScheme="onColor" isDisabled fullWidth>
        {t("titles.scheduled_from.label")}
      </MainButton>
    );
  }

  if (isFreeSubscription) {
    const handleTopUpCredits = () => {
      shallowRouter.push(ROUTES.PAYMENT_CREDITS);
    };

    return (
      <MainButton fullWidth onPress={handleTopUpCredits}>
        {t("actions.top_up_credits.label")}
      </MainButton>
    );
  }

  if (canDowngradeToFree) {
    return (
      <MainButton
        variant="outlined"
        colorScheme="onColor"
        fullWidth
        loading={loading}
        onPress={onDowngrade}
      >
        {t("actions.downgrade.label")}
      </MainButton>
    );
  }

  return null;
};
