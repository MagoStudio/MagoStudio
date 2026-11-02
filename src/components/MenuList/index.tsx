import { cn } from "@utils";
import { forwardRef } from "react";

type Props<T extends React.ElementType> = {
  className?: string;
  component?: T;
  disablePadding?: boolean;
} & React.HTMLAttributes<HTMLUListElement>;

export const MenuList = forwardRef(
  <T extends React.ElementType = "ul">(
    { children, className, component, disablePadding, ...props }: Props<T>,
    ref: React.ForwardedRef<HTMLUListElement>
  ) => {
    const Component = component || "ul";
    return (
      <Component
        className={cn(
          "relative flex flex-col gap-0.5 grow m-0 py-0.5 list-none outline-0",
          disablePadding && "p-0",
          className
        )}
        onClick={(event) => event.stopPropagation()}
        ref={ref}
        role="menu"
        tabIndex={-1}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

MenuList.displayName = "MenuList";
