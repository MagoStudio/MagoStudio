import { cn } from "@utils";

type Props = {
  children: React.ReactNode;
  controlsMiddleTopPx: number;
  placement?: "between" | "insideNextShot" | "insidePreviousShot";
};

const PLACEMENT_CLASSES = {
  between: "",
  insideNextShot: "translate-x-[14px]",
  insidePreviousShot: "-translate-x-[14px]"
};

export const ShotStripGap: React.FC<Props> = ({
  children,
  controlsMiddleTopPx,
  placement = "between"
}) => (
  <div
    className={cn(
      "relative z-10 w-0 shrink-0 self-stretch",
      PLACEMENT_CLASSES[placement]
    )}
  >
    <div
      style={{ top: controlsMiddleTopPx }}
      className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
    >
      {children}
    </div>
  </div>
);
