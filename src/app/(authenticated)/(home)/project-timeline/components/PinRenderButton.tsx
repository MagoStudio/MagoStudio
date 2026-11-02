"use client";

import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";
import { useResizeObserver } from "usehooks-ts";

const ICON_MIN_PX = 40;
const TEXT_MIN_PX = 124;

interface PinRenderButtonProps {
  onPress?: () => void;
}

export function PinRenderButton({ onPress }: PinRenderButtonProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLButtonElement>(null!);
  const [width, setWidth] = useState(0);

  useResizeObserver({
    ref,
    onResize: ({ width: w }) => setWidth(w ?? 0)
  });

  const showIcon = width >= ICON_MIN_PX;
  const showText = width >= TEXT_MIN_PX;

  return (
    <AriaButton
      ref={ref}
      type="button"
      onPress={onPress}
      aria-label={t("actions.pin_a_render.label")}
      data-testid="project-timeline-pin-render-button"
      className="group flex items-center justify-center gap-2 w-full h-full rounded bg-element-tertiary text-glyph-tertiary overflow-hidden outline-hidden transition-colors data-[hovered]:[background-image:linear-gradient(0deg,var(--color-element-for-hover),var(--color-element-for-hover))] data-[hovered]:text-glyph-primary"
    >
      {showIcon && <Icon iconSet="16" iconName="pin" />}
      {showText && (
        <Text component="span" variant="sm" color="inherit">
          {t("actions.pin_a_render.label")}
        </Text>
      )}
    </AriaButton>
  );
}
