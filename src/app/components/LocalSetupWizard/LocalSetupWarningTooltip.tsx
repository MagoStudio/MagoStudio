import { MainButton } from "@components/MainButton";
import { Tooltip } from "@components/Tooltip";
import type { Placement } from "@floating-ui/react";

export const LocalSetupWarningTooltip = ({
  message,
  actionLabel,
  onAction,
  placement,
  className,
  children
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  placement: Placement;
  className?: string;
  children: React.ReactNode;
}) => (
  <Tooltip
    isVisible
    variant="warning"
    placement={placement}
    className={className}
    trigger={children}
    textContent={
      <div className="flex flex-col items-center gap-3 text-center">
        {message}
        <MainButton colorScheme="secondary" onPress={onAction}>
          {actionLabel}
        </MainButton>
      </div>
    }
  />
);
