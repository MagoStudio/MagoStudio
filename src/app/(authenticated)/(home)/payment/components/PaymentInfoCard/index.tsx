import { Text } from "@components/Text";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

type Props = {
  id?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  footer?: React.ReactNode;
  isBestOffer?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export const PaymentInfoCard: React.FC<Props> = ({
  id,
  children,
  className,
  disabled,
  footer,
  isBestOffer
}) => {
  const { t } = useTranslation();

  const cardInner = (
    <div
      id={id}
      className={cn(
        className,
        "relative h-full min-h-60 text-glyph-primary rounded-3xl backdrop-blur-md bg-card-gradient ",
        isBestOffer ? "shadow-none" : "shadow-payment-card",
        disabled && "opacity-30"
      )}
    >
      {isBestOffer && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-full bg-glyph-action-secondary">
          <Text align="center" variant="xs">
            {t("titles.best_offer.label")}
          </Text>
        </div>
      )}
      <div className="relative h-full pb-6 pl-8 pr-6 pt-8">
        <div className="flex flex-col justify-between gap-4 h-full">
          <div className="flex flex-col gap-3">{children}</div>
          {footer && (
            <div className="flex items-center justify-between gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isBestOffer) {
    return (
      <div className="p-[2px] bg-gradient-100 rounded-3xl h-full">
        <div className="bg-surface-primary rounded-3xl h-full">{cardInner}</div>
      </div>
    );
  }

  return cardInner;
};
