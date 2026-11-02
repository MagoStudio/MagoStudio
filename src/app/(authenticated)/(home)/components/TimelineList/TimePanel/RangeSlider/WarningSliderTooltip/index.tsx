/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Message } from "@components/Message";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getRangeValidationMessage } from "./helpers/getRangeValidationMessage";

const TOOLTIP_DISPLAY_DURATION = 2000;
const TOOLTIP_COOLDOWN_DURATION = 5000;

type Props = {
  range: [number, number] | undefined;
  anchorRef: React.RefObject<HTMLElement | null>;
};

export const WarningSliderTooltip: React.FC<Props> = ({ range, anchorRef }) => {
  const { t } = useTranslation();
  const { renderSettingsValuesAtom } = useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const limits = useRenderDurationLimits();
  const [isVisible, setIsVisible] = useState(false);

  const lastShownTimeRef = useRef<number>(0);
  const prevRangeRef = useRef<[number, number] | undefined>(undefined);

  const isInterpolationEnabled = !!values?.enable_interpolation;
  const rangeLength = range ? range[1] - range[0] : 0;

  const message = range
    ? getRangeValidationMessage({
        range: rangeLength,
        isInterpolationEnabled,
        t,
        limits,
        isRelaxedEnabled: isUnlimitedModeActive
      })
    : null;

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change -- cooldown-throttled transient tooltip on upstream range changes */
  useEffect(() => {
    if (!message || !range) return;

    const rangeChanged =
      !prevRangeRef.current ||
      prevRangeRef.current[0] !== range[0] ||
      prevRangeRef.current[1] !== range[1];

    if (!rangeChanged) return;

    prevRangeRef.current = [...range];

    const currentTime = Date.now();
    const timeSinceLastShown = currentTime - lastShownTimeRef.current;

    if (timeSinceLastShown < TOOLTIP_COOLDOWN_DURATION) return;

    setIsVisible(true);
    lastShownTimeRef.current = currentTime;
  }, [message, range]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change */

  if (!isVisible || !message) return null;

  return (
    <Message
      variant="warning"
      duration={TOOLTIP_DISPLAY_DURATION}
      onDismiss={() => setIsVisible(false)}
      anchorRef={anchorRef}
      placement="bottom"
      offset={20}
      className="max-w-[var(--width-timeline-tools)] truncate"
    >
      {message}
    </Message>
  );
};
