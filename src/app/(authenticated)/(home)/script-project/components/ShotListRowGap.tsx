import { cn } from "@utils";

type Props = {
  children: React.ReactNode;
  placement?: "between" | "insideNextShot" | "insidePreviousShot";
};

const PLACEMENT_CLASSES = {
  between: "",
  insideNextShot: "translate-y-[14px]",
  insidePreviousShot: "-translate-y-[14px]"
};

export const ShotListRowGap: React.FC<Props> = ({
  children,
  placement = "between"
}) => (
  <div
    className={cn(
      "relative z-10 h-0 w-full shrink-0",
      PLACEMENT_CLASSES[placement]
    )}
  >
    <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
      {children}
    </div>
  </div>
);
