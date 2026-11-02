"use client";

import { useState, useRef } from "react";

const TOOLTIP_DELAY_MS = 300;

export const useTooltip = (delay: number = TOOLTIP_DELAY_MS) => {
  const [visible, setVisibility] = useState(false);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = (): void => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => setVisibility(true), delay);
  };

  const hideTooltip = (): void => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => setVisibility(false), delay);
  };

  const dismissTooltipNow = (): void => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setVisibility(false);
  };

  return {
    visible,
    showTooltip,
    hideTooltip,
    dismissTooltipNow
  };
};
