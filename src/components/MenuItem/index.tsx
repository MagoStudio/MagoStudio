import { cn } from "@utils";

type Props<T extends React.ElementType> = {
  children?: React.ReactNode;
  className?: string;
  component?: T;
  disablePadding?: boolean;
} & React.LiHTMLAttributes<HTMLLIElement>;

export const MenuItem = <T extends React.ElementType = "li">({
  children,
  className,
  component,
  disablePadding,
  ...props
}: Props<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof Props<T>>) => {
  const Component = component || "li";
  return (
    <Component
      className={cn(
        "relative flex items-center justify-start px-2 w-full text-left",
        disablePadding && "p-0",
        className
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </Component>
  );
};
