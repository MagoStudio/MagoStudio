import { cn } from "@utils";
import { getMenuItemClassName } from "@utils/getMenuItemClassName";

type CustomMenuItemProps<T extends React.ElementType> = {
  children?: React.ReactNode;
  className?: string;
  component?: T;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const MenuItemButton = <T extends React.ElementType = "button">({
  children,
  className,
  component,
  disabled,
  onClick,
  ...props
}: CustomMenuItemProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof CustomMenuItemProps<T>>) => {
  const Component = component || "button";
  return (
    <Component
      className={cn(
        getMenuItemClassName({ isItemDisabled: Boolean(disabled) }),
        className
      )}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};
