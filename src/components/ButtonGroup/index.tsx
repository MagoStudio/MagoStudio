import { Padding, SurfacePalette } from "@styles/types";
import { cn } from "@utils";

type Props = {
  background?: SurfacePalette | "transparent";
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  disablePadding?: Padding;
  orientation?: "horizontal" | "vertical";
} & React.HTMLAttributes<HTMLElement>;

const orientationClasses: Record<string, string> = {
  horizontal: "flex-row",
  vertical: "flex-col"
};

const backgroundClasses: Record<string, string> = {
  "surface-primary": "bg-surface-primary",
  "surface-secondary": "bg-surface-secondary",
  "surface-on-image": "bg-surface-on-image",
  "surface-bg-100": "bg-surface-bg-100",
  "surface-bg-200": "bg-surface-bg-200",
  transparent: "bg-transparent backdrop-blur-none"
};

const disablePaddingClasses: Record<string, string> = {
  all: "p-0",
  top: "pt-0",
  bottom: "pb-0",
  left: "pl-0",
  right: "pr-0"
};

export const ButtonGroup: React.FC<Props> = ({
  background,
  children,
  className,
  disabled,
  disablePadding,
  orientation = "horizontal"
}) => {
  return (
    <div
      role="group"
      className={cn(
        "relative inline-flex gap-2 py-2 px-3 rounded-lg backdrop-blur-xl [&_.button-active]:text-glyph-primary",
        orientationClasses[orientation],
        background && backgroundClasses[background],
        disablePadding && disablePaddingClasses[disablePadding],
        disabled && "[&_button]:pointer-events-none [&_a]:pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  );
};
