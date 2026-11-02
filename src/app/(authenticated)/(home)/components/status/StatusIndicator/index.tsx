import { AssetStatus } from "@schemas/asset";
import { cn } from "@utils";

interface StatusIndicatorProps {
  status: AssetStatus;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const isInProgress = status === AssetStatus.INPROGRESS;

  return (
    <div
      className={cn(
        "relative z-10 h-1.5 w-1.5 rounded-full [background-color:currentColor]",
        isInProgress &&
          "animate-status-color-change after:content-[''] after:absolute after:top-0 after:left-0 after:h-1.5 after:w-1.5 after:rounded-full after:[background-color:currentColor] after:opacity-75 after:blur-sm after:animate-status-pulse"
      )}
    />
  );
};
