/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { LinearProgress } from "@components/LinearProgress";
import { MainButton } from "@components/MainButton";
import { cn } from "@utils";
import { useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCountdown } from "usehooks-ts";

const DEFAULT_DURATION_SECONDS = 6;

type ToastProps = {
  children: React.ReactNode;
  onCancel?: () => void;
  onCancelText?: string;
  onClose?: () => void;
  onSubmit?: () => void;
  onSubmitText?: string;
  showTimer?: boolean;
  autoDismiss?: boolean;
  invertedSubmitAndCancelColors?: boolean;
  duration?: number;
};

const totalCount = 100;

export const Toast: React.FC<ToastProps> = ({
  children,
  onCancel,
  onCancelText,
  onClose,
  onSubmit,
  onSubmitText,
  showTimer = true,
  autoDismiss = showTimer,
  invertedSubmitAndCancelColors = false,
  duration = DEFAULT_DURATION_SECONDS
}) => {
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 100,
      intervalMs: (1000 * duration) / totalCount
    });

  const handleMouseEnter = () => {
    stopCountdown();
  };

  const handleMouseLeave = () => {
    if (autoDismiss) {
      startCountdown();
    }
  };

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (autoDismiss) {
      startCountdown();
    }

    return () => {
      stopCountdown();
      resetCountdown();
    };
  }, [autoDismiss, startCountdown, stopCountdown, resetCountdown]);

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- completion of a hover-pausable countdown, not an event */
  useEffect(() => {
    if (count <= 0 && autoDismiss) {
      onSubmit?.();
      handleClose();
    }
  }, [count, autoDismiss, handleClose, onSubmit]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  useHotkeys(
    "enter",
    (event) => {
      event.preventDefault();
      onSubmit?.();
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: !!onSubmit
    }
  );

  return (
    <div
      className="pointer-events-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "overflow-hidden w-notification max-w-[calc(100vw-2rem)] max-h-[calc(100vw-2rem)] rounded-lg shadow-[0_23px_24px_5px_rgba(0,0,0,0.35)] animate-notificationSlideIn bg-element-tertiary",
          showTimer && "rounded-bl-none rounded-br-none"
        )}
      >
        <div className="flex flex-col p-3 pb-5 w-full sm:w-auto font-normal select-none [&_strong]:text-glyph-action-secondary [&_strong]:font-normal">
          <div className="flex justify-between text-sm text-glyph-primary break-words">
            {children}
          </div>

          {!!(onSubmitText || onCancelText) && (
            <div className="flex items-center gap-2 mt-4 pointer-events-auto">
              {onCancelText && (
                <MainButton
                  variant="outlined"
                  colorScheme={
                    invertedSubmitAndCancelColors ? "danger" : "onColor"
                  }
                  onPress={handleCancel}
                >
                  {onCancelText}
                </MainButton>
              )}
              {onSubmitText && (
                <MainButton
                  variant="outlined"
                  colorScheme={
                    invertedSubmitAndCancelColors ? "onColor" : "danger"
                  }
                  onPress={onSubmit}
                >
                  {onSubmitText}
                </MainButton>
              )}
            </div>
          )}
        </div>

        {showTimer && (
          <div className="absolute left-0 bottom-0 w-full">
            <LinearProgress
              animation="emptying"
              size="sm"
              totalValue={totalCount}
              value={totalCount - count}
            />
          </div>
        )}
      </div>
    </div>
  );
};
