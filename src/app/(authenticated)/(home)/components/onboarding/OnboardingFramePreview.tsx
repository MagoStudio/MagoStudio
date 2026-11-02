import { Badge } from "@components/Badge";
import { CircularProgress } from "@components/CircularProgress";
import { cn } from "@utils";

interface Props {
  src: string | null | undefined;
  variant?: "entry" | "column" | "fill";
  isLoading?: boolean;
  label?: string;
}

export const OnboardingFramePreview: React.FC<Props> = ({
  src,
  variant = "entry",
  isLoading = false,
  label
}) => {
  const radius = variant === "column" ? "rounded" : "rounded-[20px]";
  const sizing = variant === "fill" ? "size-full" : "aspect-[376/194] w-full";

  return (
    <div className={cn(sizing, "relative overflow-hidden bg-black", radius)}>
      {src && (
        <img src={src} alt="" className="block h-full w-full object-contain" />
      )}
      {isLoading && !src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress size="lg" color="glyph-primary-on-pic" />
        </div>
      )}
      {label && (
        <Badge glyphColor="glyph-tertiary" className="absolute bottom-2 left-2">
          {label}
        </Badge>
      )}
    </div>
  );
};
