import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { Button } from "react-aria-components/Button";

interface PaywallPlanCardProps {
  name: string;
  subtitle: string;
  price: string;
  originalPrice?: string;
  priceCaption: string;
  features: React.ReactNode;
  ctaLabel: string;
  onCtaPress: () => void;
  learnMoreLabel: string;
  onLearnMorePress: () => void;
  highlighted?: boolean;
  bestOfferLabel?: string;
  testId?: string;
}

export const PaywallPlanCard: React.FC<PaywallPlanCardProps> = ({
  name,
  subtitle,
  price,
  originalPrice,
  priceCaption,
  features,
  ctaLabel,
  onCtaPress,
  learnMoreLabel,
  onLearnMorePress,
  highlighted,
  bestOfferLabel,
  testId
}) => (
  <div
    data-testid={testId}
    className={cn(
      "relative flex min-h-[410px] flex-1 flex-col items-center justify-between rounded-[20px] bg-[rgba(244,244,244,0.09)] py-10",
      !highlighted && "border border-[rgba(244,244,244,0.15)]"
    )}
  >
    {highlighted && (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        style={{
          padding: 2,
          background:
            "linear-gradient(180deg, var(--color-glyph-action-secondary) 0%, var(--color-element-additional-active) 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude"
        }}
      />
    )}

    {highlighted && (
      <img
        src="/paywall-hand.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-[39px] left-[calc(50%_+_90px)] z-10 w-[35%] max-w-[160px] -translate-x-[28.6%] -translate-y-[53.7%] select-none"
      />
    )}

    {highlighted && bestOfferLabel && (
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-glyph-action-secondary px-3 py-1">
        <Text variant="sm" weight="bold" color="glyph-primary-on-pic">
          {bestOfferLabel}
        </Text>
      </div>
    )}

    <div className="flex w-full flex-col gap-4 px-5">
      <div className="flex w-full flex-col gap-0.5">
        <Text
          component="h3"
          variant="xl"
          weight="bold"
          color="code-200"
          align="center"
        >
          {name}
        </Text>
        <Text variant="md" color="code-200" align="center">
          {subtitle}
        </Text>
      </div>

      <div className="flex w-full flex-col items-center gap-0.5 pb-2">
        <Text variant="xl" weight="bold" align="center" whiteSpace="nowrap">
          {originalPrice && (
            <Text
              component="span"
              variant="xl"
              weight="bold"
              color="glyph-tertiary"
              className="mr-1 line-through"
            >
              {originalPrice}
            </Text>
          )}
          {price}
        </Text>
        <Text variant="2xs" align="center">
          {priceCaption}
        </Text>
      </div>

      <div className="flex w-full flex-col gap-4 text-center">{features}</div>
    </div>

    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center justify-center px-8">
        <MainButton onPress={onCtaPress}>{ctaLabel}</MainButton>
      </div>
      <Button
        onPress={onLearnMorePress}
        className="outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary"
      >
        <Text variant="md" color="glyph-tertiary" decoration="underline">
          {learnMoreLabel}
        </Text>
      </Button>
    </div>
  </div>
);
