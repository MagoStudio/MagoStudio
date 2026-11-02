import { cn } from "@utils";
import { getSidebarEntryClassName } from "@utils/getSidebarEntryClassName";
import { forwardRef } from "react";

interface Props {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, disabled, onClick, selected, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          getSidebarEntryClassName({
            isEntryActive: Boolean(selected),
            isEntryDisabled: disabled
          }),
          className
        )}
        onClick={onClick}
        disabled={disabled}
        data-onboarding-id="pf-projects-menu"
        {...props}
      >
        {children}
      </button>
    );
  }
);

SidebarMenuButton.displayName = "SidebarMenuButton";
