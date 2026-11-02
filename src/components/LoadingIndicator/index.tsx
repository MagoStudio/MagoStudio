import { Icon } from "@components/Icon";
import { cn } from "@utils";

type Props = {
  className?: string;
  size?: "16" | "24";
} & React.HTMLAttributes<HTMLButtonElement>;

const SIZE_CLASSES: Record<"16" | "24", string> = {
  "16": "h-4 w-4",
  "24": "h-6 w-6"
};

export const LoadingIndicator: React.FC<Props> = ({
  className,
  size = "24"
}) => {
  return (
    <Icon
      iconSet="loading"
      iconName={size}
      className={cn("animate-spin", SIZE_CLASSES[size], className)}
    />
  );
};
