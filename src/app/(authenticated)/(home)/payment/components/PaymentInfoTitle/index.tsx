import { Text } from "@components/Text";
import { PaymentHint } from "@home/payment/components/PaymentHint";
import { cn } from "@utils";
type Props = {
  className?: string;
  kicker?: string;
  subtitle?: string;
  title?: string;
} & React.HTMLAttributes<HTMLElement>;

export const PaymentInfoTitle: React.FC<Props> = ({
  className,
  kicker,
  subtitle,
  title
}) => {
  return (
    <>
      <section className="relative m-auto w-full lg:max-w-[var(--breakpoint-xl)] lg:min-w-[64rem]">
        <div className="relative flex justify-start gap-[4rem]">
          <div className="absolute top-0 right-0">
            <PaymentHint />
          </div>
          <Text
            className={cn("font-syne", className)}
            color="glyph-primary-on-pic"
            component="h2"
            select="none"
            variant="3xl"
          >
            {title}
          </Text>
          {(subtitle || kicker) && (
            <div className="flex flex-col gap-2">
              {subtitle && (
                <Text
                  className="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gradient-secondary-start from-[50%] to-gradient-secondary-end to-[60%]"
                  variant="xl"
                  weight="bold"
                >
                  {subtitle}
                </Text>
              )}
              {kicker && (
                <Text
                  className="tracking-wide"
                  color="glyph-secondary"
                  variant="sm"
                >
                  {kicker}
                </Text>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};
