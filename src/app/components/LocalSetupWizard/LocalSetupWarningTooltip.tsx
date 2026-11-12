import { MainButton } from "@components/MainButton";
import { Tooltip } from "@components/Tooltip";
import type { Placement } from "@floating-ui/react";
import { cn } from "@utils";

export const LocalSetupWarningTooltip = ({
  message,
  actionLabel,
  onAction,
  placement,
  className,
  isVisible = true,
  children
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  placement: Placement;
  className?: string;
  isVisible?: boolean;
  children: React.ReactNode;
}) => (
  <Tooltip
    isVisible={isVisible}
    variant="warning"
    placement={placement}
    className={cn(
      "z-page-popover data-[react-aria-top-layer=true]:z-tooltip",
      className
    )}
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
