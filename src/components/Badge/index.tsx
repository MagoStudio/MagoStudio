import { cn } from "@utils";

type GlyphColor =
  | "glyph-primary-on-pic"
  | "glyph-primary"
  | "glyph-secondary"
  | "glyph-tertiary"
  | "glyph-success"
  | "glyph-warning"
  | "glyph-error"
  | "glyph-action-main";

type Props = {
  children?: React.ReactNode;
  className?: string;
  endIcon?: React.ReactNode;
  glyphColor?: GlyphColor;
  startIcon?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const glyphColorClasses: Record<GlyphColor, string> = {
  "glyph-primary-on-pic": "text-glyph-primary-on-pic",
  "glyph-primary": "text-glyph-primary",
  "glyph-secondary": "text-glyph-secondary",
  "glyph-tertiary": "text-glyph-tertiary",
  "glyph-success": "text-glyph-success",
  "glyph-warning": "text-glyph-warning",
  "glyph-error": "text-glyph-error",
  "glyph-action-main": "text-glyph-action-main"
};

export const Badge: React.FC<Props> = ({
  children,
  className,
  endIcon,
  glyphColor = "glyph-primary-on-pic",
  startIcon,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-start shrink-0 overflow-hidden align-middle font-semibold no-underline rounded select-none",
        "h-6 min-w-6 px-1.5 text-sm",
        "bg-element-on-image backdrop-blur-md",
        glyphColorClasses[glyphColor],
        className
      )}
      style={{ maxWidth: "42ch" }}
      {...props}
    >
      {startIcon && (
        <span className="mr-1.5 [&>svg]:w-decorator-2xs [&>svg]:h-[0.625rem]">
          {startIcon}
        </span>
      )}
      <span className="items-center grow overflow-hidden leading-tight whitespace-nowrap text-ellipsis font-normal">
        {children}
      </span>
      {endIcon && (
        <span className="ml-1.5 [&>svg]:w-decorator-2xs [&>svg]:h-[0.625rem]">
          {endIcon}
        </span>
      )}
    </div>
  );
};
