import { cn } from "@utils";

type Props = {
  className?: string;
} & React.HTMLAttributes<HTMLHRElement>;

export const Divider: React.FC<Props> = ({ className, ...props }) => {
  return (
    <hr
      className={cn(
        "shrink-0 h-px w-full border-none bg-glyph-invert-main",
        className
      )}
      {...props}
    />
  );
};
