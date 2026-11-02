"use client";

import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { usePricingContent } from "@home/pricing/hooks/usePricingContent";

export function PricingCustomSolution() {
  const { content } = usePricingContent();
  const { badgeLabel, title, description, checklist } = content.customSolution;

  return (
    <div
      className="flex flex-1 flex-col gap-5 px-8 py-10 rounded-bl-[20px] rounded-tl-[20px] backdrop-blur-[16px] shadow-payment-card"
      style={{
        backgroundImage:
          "linear-gradient(65deg, rgba(11, 13, 30, 0.3) 31%, rgba(101, 111, 255, 0.3) 93%)"
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center self-start px-[7px] py-[2px] rounded bg-surface-bg-100 border border-transparent overflow-hidden">
          <Text variant="sm" color="glyph-primary-on-pic">
            {badgeLabel}
          </Text>
        </div>

        <div className="flex flex-col gap-1">
          <Text variant="xl" weight="bold" color="glyph-primary" component="h2">
            {title}
          </Text>
          <Text variant="sm" color="glyph-secondary">
            {description}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {checklist.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <Icon
              iconSet="16"
              iconName="checkmark"
              className="text-glyph-primary-on-pic shrink-0"
            />
            <Text variant="md" color="glyph-primary-on-pic">
              {item}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
