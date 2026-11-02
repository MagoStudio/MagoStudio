import { Text } from "@components/Text";
import { cn } from "@utils";

type Props = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const Tag: React.FC<Props> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded bg-glyph-action-main px-1 py-0 backdrop-blur select-none",
        className
      )}
      {...props}
    >
      <Text component="span" variant="sm" color="glyph-primary-on-pic">
        {children}
      </Text>
    </div>
  );
};
