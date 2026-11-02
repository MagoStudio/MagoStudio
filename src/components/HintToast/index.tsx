/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useCallback, useEffect } from "react";
import { useCountdown } from "usehooks-ts";

const DEFAULT_HINT_DURATION_SECONDS = 10;
const TOTAL_COUNT = 100;

type HintToastProps = {
  message: React.ReactNode;
  onClose?: () => void;
  duration?: number;
};

export const HintToast: React.FC<HintToastProps> = ({
  message,
  onClose,
  duration = DEFAULT_HINT_DURATION_SECONDS
}) => {
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: TOTAL_COUNT,
      intervalMs: (1000 * duration) / TOTAL_COUNT
    });

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    startCountdown();

    return () => {
      stopCountdown();
      resetCountdown();
    };
  }, [startCountdown, stopCountdown, resetCountdown]);

  useEffect(() => {
    if (count <= 0) {
      handleClose();
    }
  }, [count, handleClose]);

  return (
    <div
      className="pointer-events-auto"
      onMouseEnter={stopCountdown}
      onMouseLeave={startCountdown}
    >
      <div className="overflow-hidden w-notification max-w-[calc(100vw-2rem)] max-h-[calc(100vw-2rem)] rounded-lg shadow-glassmorphism animate-notificationSlideIn bg-element-additional-active-transparent backdrop-blur-md">
        <div className="flex flex-col p-4 w-full sm:w-auto font-normal select-none">
          <div className="flex items-start gap-2 text-sm text-glyph-primary-on-pic">
            <div className="flex items-center h-full justify-center">
              <Icon
                iconSet="24"
                iconName="bulb"
                className="text-glyph-primary-on-pic"
              />
            </div>
            <Text color="glyph-primary-on-pic" variant="sm" lineHeight="snug">
              {message}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
