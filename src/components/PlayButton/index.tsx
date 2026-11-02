import { Icon } from "@components/Icon";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
type PlayButtonProps = {
  className?: string;
  isDisabled?: boolean;
  isPlaying: boolean;
  noVideo?: boolean;
  onPress: () => void;
  variant?: "compact" | "standalone";
  "aria-label"?: string;
};

const variantStyles = {
  compact: "w-14 h-8 rounded",
  standalone: "w-20 h-[66px] border-r border-glyph-invert-main"
} as const;

const backgroundStyles = (isDisabled: boolean, noVideo: boolean) =>
  isDisabled || noVideo ? "bg-element-tertiary" : "bg-element-primary";

export const PlayButton: React.FC<PlayButtonProps> = ({
  className,
  isDisabled = false,
  isPlaying,
  noVideo = false,
  onPress,
  variant = "compact",
  ...rest
}) => (
  <AriaButton
    {...rest}
    type="button"
    isDisabled={isDisabled}
    onPress={onPress}
    className={cn(
      "flex items-center justify-center select-none transition-colors",
      "outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary focus-visible:ring-offset-1",
      "text-glyph-primary data-[disabled]:text-glyph-disabled",
      variantStyles[variant],
      backgroundStyles(isDisabled, noVideo),
      className
    )}
  >
    {!noVideo && (
      <Icon
        iconSet="24-filled"
        iconName={isPlaying ? "pause" : "play-forward"}
      />
    )}
  </AriaButton>
);
