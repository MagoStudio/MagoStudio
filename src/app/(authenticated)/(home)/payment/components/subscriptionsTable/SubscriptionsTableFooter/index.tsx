import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

export const SubscriptionsTableFooter: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 items-center justify-center w-full">
      <div className="flex items-center gap-1 justify-center">
        <Icon
          iconSet="16"
          iconName="checkmark"
          className="text-glyph-action-main"
        />
        <Text align="center" color="glyph-primary" variant="xs" select="none">
          {t("notifications.secure_payments_by.description")}
        </Text>
        <div className="mb-1">
          <a href="https://stripe.com/" target="_blank">
            <img
              alt="Stripe"
              src="/stripe_logo.svg"
              className="inline-block shrink-0 h-4 min-w-10"
            />
          </a>
        </div>
      </div>
      <Text align="center" color="glyph-success" variant="xs" select="none">
        {t("notifications.cancel_anytime.description")}
      </Text>
      <Text align="center" color="glyph-tertiary" variant="xs" select="none">
        {t("notifications.enjoy_early_access.description")}
      </Text>
    </div>
  );
};
