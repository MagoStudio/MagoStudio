import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { PaymentFaq } from "@home/payment/components/PaymentFaq";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { useTranslation } from "react-i18next";

export const PaymentInfo: React.FC = () => {
  const shallowRouter = useShallowRouter();
  const handleTopUpCredits = () => {
    shallowRouter.push(`${ROUTES.PAYMENT_MAIN_PAGE}?tab=credits`);
  };

  const { t } = useTranslation();
  return (
    <div className="flex gap-6">
      <div className="w-2/3">
        <PaymentFaq />
      </div>
      <div className="flex flex-col gap-6 w-1/3">
        <aside className="flex flex-col gap-2 p-8 w-full rounded-3xl bg-card-gradient shadow-payment-card backdrop-blur-md">
          <Text
            align="center"
            component="h3"
            select="none"
            variant="xl"
            weight="bold"
          >
            {t("payment.cost_details.title")}
          </Text>
          <Text
            align="center"
            color="glyph-primary"
            lineHeight="relaxed"
            variant="xs"
            whiteSpace="pre-line"
          >
            {t("payment.cost_details.description")}
          </Text>
        </aside>
        <aside className="relative flex flex-col gap-4 p-8 w-full rounded-3xl bg-card-gradient shadow-payment-card backdrop-blur-md">
          <Text
            align="center"
            component="h3"
            select="none"
            variant="xl"
            weight="bold"
          >
            {t("payment.extra_credits.title")}
          </Text>
          <div className="relative w-full">
            <MainButton fullWidth onPress={handleTopUpCredits}>
              {t("actions.top_up_credits.label")}
            </MainButton>
            <div className="absolute right-0 -top-11 select-none pointer-events-none">
              <img alt="Hand" src="/hand.png" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
