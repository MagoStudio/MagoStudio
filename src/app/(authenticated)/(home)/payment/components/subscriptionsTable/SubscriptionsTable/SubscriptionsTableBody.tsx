import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { TooltipIcon } from "@components/TooltipIcon";
import {
  CREDIT_MODE_SIMULTANEOUS_VIDEO_RENDERS,
  MAX_CREDITS_MODE
} from "@config/constants";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useCancelModal } from "@hooks/payment/useCancelModal";
import { useCancelSubscription } from "@hooks/payment/useCancelSubscription";
import { useChangeSubscription } from "@hooks/payment/useChangeSubscription";
import { useDowngradeModal } from "@hooks/payment/useDowngradeModal";
import { enrichWithLegacyPlan, usePrices } from "@hooks/payment/usePrices";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useTooltip } from "@hooks/useTooltip";
import { RelaxedModeType, SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
import { cn } from "@utils";
import { formatCreditCount } from "@utils/formatCreditCount";
import React, { ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import {
  formatPrice,
  formatPriceBeforeDiscount
} from "../../helpers/formatPrice";
import { getCurrencySymbol } from "../../helpers/getCurrencySymbol";
import { getPlanTierLevel } from "../../helpers/getPlanTierLevel";
import { PaymentSubscriptionButtons } from "../PaymentSubscriptionButtons";

import { CancelSubscriptionModal } from "./CancelSubscriptionModal";
import { DowngradeSubscriptionModal } from "./DowngradeSubscriptionModal";
import { FreePlanButton } from "./FreePlanButton";
import { getSubscriptionExpirationLabel } from "./getSubscriptionExpirationLabel";

type Props = {
  isYearly: boolean;
};

interface DisplayPlan {
  plan: PriceOption;
  title: string;
  isCurrentPlan: boolean;
  planType: string;
  tooltipKey: string | undefined;
}

const getBasePlanName = (planTitle: string): string => {
  const lower = planTitle.toLowerCase();
  if (lower.includes("basic")) return "Basic";
  if (lower.includes("pro")) return "Pro";
  if (lower.includes("studio")) return "Studio";
  return planTitle;
};

const getDisplayPlanName = (plan: PriceOption): string | undefined => {
  const planTitle = plan.features?.title;
  if (!planTitle) return undefined;
  const baseName = getBasePlanName(planTitle);
  return plan.features?.archived ? `${baseName} (deprecated)` : baseName;
};

const getPlanTooltipKey = (planType: string): string | undefined => {
  const lower = planType.toLowerCase();
  if (lower.includes("basic"))
    return "payment.basic_mounthly_tooltip.description";
  if (lower.includes("pro")) return "payment.pro_mounthly_tooltip.description";
  if (lower.includes("studio"))
    return "payment.studio_monthly_tooltip.description";
  return undefined;
};

const selectPlanVariant = (
  subscriptions: PriceOption[],
  monthlyTitle: SubscriptionType,
  annualTitle: SubscriptionType,
  isYearly: boolean
): PriceOption | undefined => {
  const monthly = subscriptions.find((s) => s.features?.title === monthlyTitle);
  const annual = subscriptions.find((s) => s.features?.title === annualTitle);
  return isYearly ? (annual ?? monthly) : (monthly ?? annual);
};

const buildDisplayPlans = (
  subscriptions: PriceOption[],
  subscriptionType: SubscriptionType | undefined,
  isYearly: boolean
): DisplayPlan[] => {
  const planGroups: Array<{
    monthly: SubscriptionType;
    annual: SubscriptionType;
  }> = [
    {
      monthly: SubscriptionType.UNLIMITED_BASIC,
      annual: SubscriptionType.UNLIMITED_BASIC
    },
    {
      monthly: SubscriptionType.UNLIMITED_PRO,
      annual: SubscriptionType.UNLIMITED_PRO_ANNUAL
    },
    {
      monthly: SubscriptionType.UNLIMITED_STUDIO,
      annual: SubscriptionType.UNLIMITED_STUDIO_ANNUAL
    }
  ];

  const plans: DisplayPlan[] = [];

  for (const group of planGroups) {
    const plan = selectPlanVariant(
      subscriptions,
      group.monthly,
      group.annual,
      isYearly
    );
    if (!plan) continue;
    if (plan.features?.hidden) continue;

    const planType = plan.features?.title ?? "";
    const isCurrentPlan =
      subscriptionType === group.monthly || subscriptionType === group.annual;

    plans.push({
      plan,
      title: getDisplayPlanName(plan) ?? planType,
      isCurrentPlan,
      planType,
      tooltipKey: getPlanTooltipKey(planType)
    });
  }

  return plans.sort(
    (a, b) => getPlanTierLevel(a.planType) - getPlanTierLevel(b.planType)
  );
};

export const SubscriptionsTableBody: React.FC<Props> = ({ isYearly }) => {
  const { t } = useTranslation();
  const { data: rawPricesData } = usePrices();

  const {
    subscriptionType,
    subscription,
    subscriptionExpirationDate,
    isFreeSubscription,
    canDowngradeToFree,
    isScheduledToFree,
    scheduledStartDate,
    canCancelSubscription,
    isSubscriptionCancelled,
    isSubscriptionExpired,
    isSubscriptionIncompleteExpired,
    isSubscriptionPastDue
  } = useCurrentSubscription();
  const { mutate: cancelSubscription, isPending: isCancelLoading } =
    useCancelSubscription();
  const { mutate: changeSubscription, isPending: isChangeLoading } =
    useChangeSubscription();
  const downgradeModalData = useDowngradeModal();
  const cancelModalData = useCancelModal();

  const pricesData = rawPricesData
    ? enrichWithLegacyPlan(rawPricesData, subscription, subscriptionType)
    : rawPricesData;

  const subscriptions = pricesData?.subscription || [];

  const displayPlans = buildDisplayPlans(
    subscriptions,
    subscriptionType,
    isYearly
  );

  const defaultCurrency =
    subscription?.price_currency || subscriptions[0]?.currency;

  const handleDowngradeToFree = () => {
    downgradeModalData.openModal(SubscriptionType.FREE);
  };

  const handleDowngradeToPaidPlan = (
    targetPlan: SubscriptionType,
    targetPriceId: string
  ) => {
    downgradeModalData.openModal(targetPlan, targetPriceId);
  };

  const handleConfirmDowngrade = () => {
    if (!subscription?.id) return;
    downgradeModalData.confirmDowngrade(
      () => cancelSubscription({ subscriptionId: subscription.id! }),
      (priceId) =>
        changeSubscription({
          subscriptionId: subscription.id!,
          priceId
        })
    );
  };

  const handleConfirmCancel = () => {
    cancelModalData.confirmCancel((subscriptionId) =>
      cancelSubscription({ subscriptionId })
    );
  };

  const getExpirationLabel = (planType?: SubscriptionType) =>
    getSubscriptionExpirationLabel({
      currentSubscription: subscription,
      isSubscriptionIncompleteExpired,
      isSubscriptionCancelled,
      isSubscriptionExpired,
      isSubscriptionPastDue,
      availableSubscriptions: pricesData?.subscription,
      t,
      planType,
      subscriptionType
    });

  const onContactUsClick = () => {
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed [&_th]:py-3 [&_th]:align-top [&_td]:py-4 [&_tbody_td]:border-b [&_tbody_td]:border-b-glyph-stroke">
          <thead className="border-b border-b-glyph-stroke">
            <tr>
              <th className="w-[13%]"></th>
              <th>
                <CurrentPlan
                  show={subscriptionType === SubscriptionType.FREE}
                  data-testid="current-plan-free"
                />
              </th>
              {displayPlans.map((dp) => (
                <th key={`current-${dp.planType}`}>
                  <CurrentPlan show={dp.isCurrentPlan} />
                </th>
              ))}
              <th></th>
            </tr>

            <tr>
              <th></th>
              <th>
                <PlanTitle>{t("titles.free_plan.label")}</PlanTitle>
              </th>
              {displayPlans.map((dp) => (
                <th key={`title-${dp.planType}`}>
                  <PlanTitle>{dp.title}</PlanTitle>
                </th>
              ))}
              <th>
                <PlanTitle>{t("titles.enterprise.label")}</PlanTitle>
              </th>
            </tr>

            <tr>
              <th></th>
              <th>
                <Price price={`${getCurrencySymbol(defaultCurrency)}0`} />
              </th>
              {displayPlans.map((dp) => (
                <th key={`price-${dp.planType}`}>
                  <Price
                    price={formatPlanPrice(dp.plan)}
                    priceBeforeDiscount={formatPlanPriceBeforeDiscount(dp.plan)}
                  />
                </th>
              ))}
              <th>
                <Price price={t("payment.custom.description")} />
              </th>
            </tr>

            <tr>
              <th></th>
              <th className="px-11">
                <div className="flex justify-center">
                  <div className="w-44">
                    <FreePlanButton
                      loading={isCancelLoading}
                      onDowngrade={handleDowngradeToFree}
                      isFreeSubscription={isFreeSubscription}
                      canDowngradeToFree={canDowngradeToFree}
                      isScheduledToFree={isScheduledToFree}
                      scheduledStartDate={scheduledStartDate}
                    />
                  </div>
                </div>
              </th>
              {displayPlans.map((dp) => (
                <th
                  key={`button-${dp.planType}`}
                  className="px-11"
                  data-testid={`subscription-cta-${dp.planType}`}
                >
                  <div className="flex justify-center">
                    <div className="w-44">
                      <PaymentSubscriptionButtons
                        loading={isChangeLoading}
                        onDowngradeClick={
                          getPlanTierLevel(dp.planType) <
                          getPlanTierLevel(subscriptionType)
                            ? (targetPriceId) =>
                                handleDowngradeToPaidPlan(
                                  dp.planType as SubscriptionType,
                                  targetPriceId
                                )
                            : undefined
                        }
                        cardPlan={dp.plan}
                        isCurrentPlan={dp.isCurrentPlan}
                      />
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-11">
                <div className="flex justify-center">
                  <div className="w-44">
                    <MainButton fullWidth onPress={onContactUsClick}>
                      {t("actions.contact_us.label")}
                    </MainButton>
                  </div>
                </div>
              </th>
            </tr>

            <tr>
              <th></th>
              <th className="px-14"></th>
              {displayPlans.map((dp) => {
                const planTitle = dp.plan.features?.title;
                const isUserOnThisPlan = planTitle === subscriptionType;
                const alertLabel = getExpirationLabel(
                  planTitle as SubscriptionType | undefined
                );

                return (
                  <th key={`desc-${dp.planType}`} className="px-14">
                    {canCancelSubscription && isUserOnThisPlan ? (
                      <CancelButton
                        onCancelClick={cancelModalData.openModal}
                        subscriptionId={subscription?.id ?? undefined}
                      />
                    ) : (
                      isUserOnThisPlan &&
                      alertLabel && (
                        <Text
                          align="center"
                          color="glyph-error"
                          lineHeight="relaxed"
                          select="none"
                          variant="xs"
                        >
                          {alertLabel}
                        </Text>
                      )
                    )}
                  </th>
                );
              })}
              <th className="px-14"></th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.monthly_credits.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <TextWithTooltip
                  text={t(
                    "payment.buy_credits_to_generate_renders.description"
                  )}
                />
              </td>
              {displayPlans.map((dp) => (
                <td key={`credits-${dp.planType}`}>
                  <TextWithTooltip
                    text={
                      dp.plan.credits
                        ? formatCreditCount(dp.plan.credits)
                        : undefined
                    }
                    tooltip={
                      dp.tooltipKey
                        ? t(dp.tooltipKey, { count: dp.plan.credits })
                        : undefined
                    }
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip text={t("payment.custom.description")} />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.relaxed_mode.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td
                  key={`relaxed-${dp.planType}`}
                  data-testid={`relaxed-cell-${dp.planType}`}
                >
                  <RelaxedModeCell
                    relaxedModeType={dp.plan.features?.relaxed_mode_type}
                    frames={dp.plan.features?.maximum_frame_range}
                  />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.simultaneous_video_renders.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`vid-${dp.planType}`}>
                  <TextWithTooltip
                    text={dp.plan.features?.simultaneous_video_renders}
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip text={t("payment.custom.description")} />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.simultaneous_image_renders.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`img-${dp.planType}`}>
                  <TextWithTooltip
                    text={dp.plan.features?.simultaneous_image_renders}
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip text={t("payment.custom.description")} />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.max_frames_in_a_single_run.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`frames-${dp.planType}`}>
                  <TextWithTooltip
                    text={dp.plan.features?.maximum_frame_range}
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip text={t("payment.custom.description")} />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.credit_mode.description")}
                  tooltip={t("payment.credit_mode_tooltip.description", {
                    frames: MAX_CREDITS_MODE
                  })}
                  className="justify-start"
                />
              </td>
              <td>
                <Check />
              </td>
              {displayPlans.map((dp) => (
                <td key={`credit-mode-${dp.planType}`}>
                  <Check />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.simultaneous_video_renders.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <TextWithTooltip
                  text={CREDIT_MODE_SIMULTANEOUS_VIDEO_RENDERS}
                />
              </td>
              {displayPlans.map((dp) => (
                <td key={`credit-vid-${dp.planType}`}>
                  <TextWithTooltip
                    text={CREDIT_MODE_SIMULTANEOUS_VIDEO_RENDERS}
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip
                  text={CREDIT_MODE_SIMULTANEOUS_VIDEO_RENDERS}
                />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.simultaneous_image_renders.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <TextWithTooltip text={t("payment.unlimited.label")} />
              </td>
              {displayPlans.map((dp) => (
                <td key={`credit-img-${dp.planType}`}>
                  <TextWithTooltip text={t("payment.unlimited.label")} />
                </td>
              ))}
              <td>
                <TextWithTooltip text={t("payment.unlimited.label")} />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.max_frames_in_a_single_run.description")}
                  className="justify-start pl-5"
                />
              </td>
              <td>
                <TextWithTooltip
                  text={t("payment.frames_count.description", {
                    count: MAX_CREDITS_MODE
                  })}
                />
              </td>
              {displayPlans.map((dp) => (
                <td key={`credit-frames-${dp.planType}`}>
                  <TextWithTooltip
                    text={t("payment.frames_count.description", {
                      count: MAX_CREDITS_MODE
                    })}
                  />
                </td>
              ))}
              <td>
                <TextWithTooltip
                  text={t("payment.frames_count.description", {
                    count: MAX_CREDITS_MODE
                  })}
                />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.support.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <TextWithTooltip text={t("payment.support_free.description")} />
              </td>
              {displayPlans.map((dp) => (
                <td key={`support-${dp.planType}`}>
                  <TextWithTooltip
                    text={
                      dp.planType.toLowerCase().includes("studio")
                        ? t("payment.support_studio.description")
                        : t("payment.support_free.description")
                    }
                  />
                </td>
              ))}
              <td>
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Text color="glyph-primary">
                    {t("payment.support_enterprise.description")}
                  </Text>
                  <Text color="glyph-primary" variant="xs">
                    {t("payment.support_enterprise.subtitle")}
                  </Text>
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.onboarding_session.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`onboarding-${dp.planType}`}>
                  {dp.planType.toLowerCase().includes("studio") ? (
                    <Check />
                  ) : (
                    <Cross />
                  )}
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.team_training.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`team-training-${dp.planType}`}>
                  <Cross />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.dedicated_infrastructure.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`dedicated-${dp.planType}`}>
                  <Cross />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t("payment.custom_models.description")}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`custom-models-${dp.planType}`}>
                  <Cross />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>

            <tr>
              <td>
                <TextWithTooltip
                  text={t(
                    "payment.custom_moderation_and_safeguards.description"
                  )}
                  className="justify-start"
                />
              </td>
              <td>
                <Cross />
              </td>
              {displayPlans.map((dp) => (
                <td key={`moderation-${dp.planType}`}>
                  <Cross />
                </td>
              ))}
              <td>
                <Check />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CancelSubscriptionModal
        currentPlan={subscriptionType}
        expirationDate={subscriptionExpirationDate}
        isOpen={cancelModalData.isOpen}
        onClose={cancelModalData.closeModal}
        onConfirm={handleConfirmCancel}
      />

      <DowngradeSubscriptionModal
        currentPlan={subscriptionType}
        expirationDate={subscriptionExpirationDate}
        isOpen={downgradeModalData.isOpen}
        onClose={downgradeModalData.closeModal}
        onConfirm={handleConfirmDowngrade}
        targetPlan={downgradeModalData.targetPlan || undefined}
      />
    </>
  );
};

const formatPlanPrice = (plan: PriceOption | undefined): string | undefined => {
  if (!plan) return undefined;
  const currencySymbol = getCurrencySymbol(plan.currency);
  if (!plan.price) return `${currencySymbol}0`;
  return `${currencySymbol}${formatPrice(plan.price)}`;
};

const formatPlanPriceBeforeDiscount = (
  plan: PriceOption | undefined
): string | undefined => {
  if (!plan?.price || !plan?.discount) return undefined;
  const currencySymbol = getCurrencySymbol(plan.currency);

  return `${currencySymbol}${formatPriceBeforeDiscount(plan.price, plan.discount)}`;
};

const PlanTitle = ({ children }: { children: ReactNode }) => (
  <Text
    color="code-100"
    select="none"
    variant="xl"
    weight="bold"
    overflow="hidden"
    textOverflow="ellipsis"
    align="center"
  >
    {children}
  </Text>
);

const Price = ({
  price,
  priceBeforeDiscount
}: {
  price?: string;
  priceBeforeDiscount?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {priceBeforeDiscount && (
          <Text color="glyph-disabled" select="none" variant="xl" weight="bold">
            <s>{priceBeforeDiscount}</s>
          </Text>
        )}
        {price && (
          <div className="flex flex-col items-center gap-0.5 overflow-hidden text-ellipsis text-wrap">
            <Text
              color="glyph-primary"
              select="none"
              variant="xl"
              weight="bold"
            >
              {price}
            </Text>
          </div>
        )}
      </div>
      <Text align="center" color="glyph-primary" select="none" variant="xs">
        {t("payment.per_month.description")}
      </Text>
    </div>
  );
};

const TextWithTooltip = ({
  text,
  tooltip,
  className = ""
}: {
  text?: number | string;
  tooltip?: string;
  className?: string;
}) => {
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <div
      className={cn("flex justify-center gap-2", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <Text color="glyph-primary" overflow="hidden" textOverflow="ellipsis">
        {text}
      </Text>
      {tooltip && (
        <TooltipIcon
          icon="help"
          iconColor="glyph-tertiary"
          iconSize="sm"
          isVisible={visible}
        >
          {tooltip}
        </TooltipIcon>
      )}
    </div>
  );
};

const CancelButton = ({
  onCancelClick,
  subscriptionId
}: {
  onCancelClick?: (subscriptionId: string) => void;
  subscriptionId?: string;
}) => {
  const { t } = useTranslation();

  const handleCancelClick = () => {
    if (!subscriptionId) return;
    trackingUtils.paymentActions.paymentSubscriptionCancel(subscriptionId);
    onCancelClick?.(subscriptionId);
  };

  return (
    <AriaButton
      className="text-glyph-secondary hover:text-glyph-primary"
      onPress={handleCancelClick}
    >
      <Text variant="xs" color="inherit" className="underline">
        {t("actions.cancel.label")}
      </Text>
    </AriaButton>
  );
};

const Check = () => (
  <div className="flex justify-center">
    <Icon iconSet="16" iconName="checkmark" className="text-glyph-success" />
  </div>
);

const CheckWithFrameLimit = ({ frames }: { frames?: number }) => {
  const { t } = useTranslation();
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <div
      className="flex justify-center gap-2"
      data-testid={`relaxed-mode-check-${frames}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <Icon iconSet="16" iconName="checkmark" className="text-glyph-success" />
      {frames != null && (
        <TooltipIcon
          icon="help"
          iconColor="glyph-tertiary"
          iconSize="sm"
          isVisible={visible}
        >
          {t("payment.relaxed_mode_plan_tooltip.description", { frames })}
        </TooltipIcon>
      )}
    </div>
  );
};

const RelaxedModeCell = ({
  relaxedModeType,
  frames
}: {
  relaxedModeType?: RelaxedModeType | null;
  frames?: number;
}) => {
  const { t } = useTranslation();

  if (relaxedModeType === RelaxedModeType.RELAXED) {
    return (
      <TextWithTooltip
        text={t("payment.relaxed_mode_cell.description")}
        tooltip={t("payment.relaxed_mode_cell_tooltip.description")}
      />
    );
  }

  if (relaxedModeType === RelaxedModeType.UNLIMITED) {
    return (
      <TextWithTooltip
        text={t("payment.unlimited_mode_cell.description")}
        tooltip={t("payment.unlimited_mode_cell_tooltip.description")}
      />
    );
  }

  return <CheckWithFrameLimit frames={frames} />;
};

const Cross = () => (
  <div className="flex justify-center">
    <Icon iconSet="16" iconName="cross" className="text-glyph-tertiary" />
  </div>
);

const CurrentPlan = ({ show, ...rest }: { show: boolean }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn("flex flex-col items-center gap-0.5", {
        ["opacity-0"]: !show
      })}
      {...rest}
    >
      <Icon iconSet="pixels" iconName="add-credits" />
      <Text align="center" color="glyph-warning" select="none" variant="xs">
        {t("titles.current_plan.label")}
      </Text>
    </div>
  );
};
