import { DialogBackdrop } from "@headlessui/react";
import { cn } from "@utils";

type Props = {
  className?: string;
  color?: "backdrop" | "transparent";
} & React.HTMLAttributes<HTMLElement>;

export const Backdrop: React.FC<Props> = ({
  className,
  color = "backdrop"
}) => {
  return (
    <DialogBackdrop
      data-testid="modal-backdrop"
      className={cn(
        "fixed -z-10 inset-0",
        color === "backdrop" && "bg-backdrop",
        color === "transparent" && "bg-transparent",
        className
      )}
    />
  );
};
