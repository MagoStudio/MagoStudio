import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { getDiscountedPrice } from "@domains/payment/utils/getDiscountedPrice";
import { formatPrice } from "@home/payment/components/helpers/formatPrice";
import { getCurrencySymbol } from "@home/payment/components/helpers/getCurrencySymbol";
import { useCreateCheckoutSession } from "@hooks/payment/useCreateCheckoutSession";
import { usePrices } from "@hooks/payment/usePrices";
import { SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
import { isNewUsersPaywallOpenAtom } from "@store/atoms";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { PaywallPlanCard } from "./PaywallPlanCard";

const title = (label: string) => (
  <Text
    component="h2"
    weight="normal"
    align="center"
    color="glyph-primary-on-pic"
    className="mx-auto block max-w-[604px] font-syne text-[40px] leading-[44px] tracking-[-0.4px]"
  >
    {label}
  </Text>
);

export const NewUsersPaywall: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useAtom(isNewUsersPaywallOpenAtom);
  const { data: pricesData } = usePrices();
  const { mutate: createCheckoutSession } = useCreateCheckoutSession();
  const router = useRouter();

  const close = () => setIsOpen(false);

  const findPlan = (planTitle: SubscriptionType): PriceOption | undefined =>
    pricesData?.subscription.find(
      (option) => option.features?.title === planTitle
    );

  const proPlan = findPlan(SubscriptionType.UNLIMITED_PRO);
  const studioPlan = findPlan(SubscriptionType.UNLIMITED_STUDIO);

  const goToCredits = () => {
    close();
    router.push(ROUTES.PAYMENT_CREDITS);
  };

  const goToPricing = () => {
    close();
    router.push(ROUTES.PRICING_PAGE);
  };

  const subscribe = (plan: PriceOption) => {
    close();
    createCheckoutSession({
      priceId: plan.id,
      addCoupon: getDiscountedPrice(plan) !== undefined
    });
  };

  const freeRendersLine = (
    boldLabel: string,
    restLabel: string,
    simultaneousNote: string
  ) => (
    <Text
      variant="md"
      align="center"
      whiteSpace="pre-line"
      className="leading-5"
    >
      <Text component="span" variant="md" weight="bold">
        {boldLabel}
      </Text>
      {restLabel}
      {"\n"}
      <Text component="span" variant="md" color="glyph-tertiary">
        {simultaneousNote}
      </Text>
    </Text>
  );

  const planPriceProps = (plan: PriceOption) => {
    const symbol = getCurrencySymbol(plan.currency);
    const discount = getDiscountedPrice(plan);
    if (discount) {
      const discounted = `${symbol}${formatPrice(discount.discounted)}`;
      return {
        price: discounted,
        originalPrice: `${symbol}${formatPrice(discount.original)}`,
        priceCaption: t("new_users_paywall.discount_note.label", {
          price: discounted
        })
      };
    }
    return {
      price: `${symbol}${formatPrice(plan.price)}`,
      priceCaption: t("new_users_paywall.per_month.label")
    };
  };

  const pro = proPlan ? planPriceProps(proPlan) : undefined;
  const studio = studioPlan ? planPriceProps(studioPlan) : undefined;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      enterAnimation
      surfaceClassName="bg-transparent bg-gradient-200 shadow-[0px_-1px_0px_0px_rgba(87,97,255,0.8)]"
      contentClassName="px-8 pt-12 pb-14"
      widthClassName="w-screen lg:w-[min(1392px,90vw)]"
      unlimitedTitleHeight
      titleContent={title(t("new_users_paywall.title.label"))}
    >
      <div className="flex w-full flex-col items-stretch gap-4 pt-5 md:flex-row">
        <PaywallPlanCard
          name={t("new_users_paywall.free.name.label")}
          subtitle={t("new_users_paywall.free.subtitle.label")}
          price={t("new_users_paywall.free.price.label")}
          priceCaption={t("new_users_paywall.per_month.label")}
          features={
            <Text variant="md" align="center">
              {t("new_users_paywall.free.line_1.label")}
            </Text>
          }
          ctaLabel={t("new_users_paywall.buy_credits.label")}
          onCtaPress={goToCredits}
          learnMoreLabel={t("new_users_paywall.learn_more.label")}
          onLearnMorePress={goToPricing}
          testId="paywall-card-free"
        />

        {proPlan && pro && (
          <PaywallPlanCard
            name={t("new_users_paywall.pro.name.label")}
            subtitle={t("new_users_paywall.pro.subtitle.label")}
            price={pro.price}
            originalPrice={pro.originalPrice}
            priceCaption={pro.priceCaption}
            features={freeRendersLine(
              t("new_users_paywall.pro.free_renders_bold.label"),
              t("new_users_paywall.pro.free_renders_rest.label"),
              t("new_users_paywall.pro.simultaneous_note.label")
            )}
            ctaLabel={t("new_users_paywall.subscribe.label")}
            onCtaPress={() => subscribe(proPlan)}
            learnMoreLabel={t("new_users_paywall.learn_more.label")}
            onLearnMorePress={goToPricing}
            testId="paywall-card-pro"
          />
        )}

        {studioPlan && studio && (
          <PaywallPlanCard
            name={t("new_users_paywall.studio.name.label")}
            subtitle={t("new_users_paywall.studio.subtitle.label")}
            price={studio.price}
            originalPrice={studio.originalPrice}
            priceCaption={studio.priceCaption}
            features={freeRendersLine(
              t("new_users_paywall.studio.free_renders_bold.label"),
              t("new_users_paywall.studio.free_renders_rest.label"),
              t("new_users_paywall.studio.simultaneous_note.label")
            )}
            ctaLabel={t("new_users_paywall.subscribe.label")}
            onCtaPress={() => subscribe(studioPlan)}
            learnMoreLabel={t("new_users_paywall.learn_more.label")}
            onLearnMorePress={goToPricing}
            highlighted
            bestOfferLabel={t("new_users_paywall.best_offer.label")}
            testId="paywall-card-studio"
          />
        )}
      </div>
    </Modal>
  );
};
