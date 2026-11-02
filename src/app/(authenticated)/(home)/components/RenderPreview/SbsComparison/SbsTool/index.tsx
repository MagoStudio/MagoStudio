import { Icon } from "@components/Icon";
import { cn } from "@utils";

type Props = {
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const SbsTool: React.FC<Props> = ({ className }) => {
  return (
    <div className={cn("relative z-10 h-full w-5", className)}>
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <div
          className="flex justify-center items-center h-9 w-5 bg-glyph-primary-on-pic"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}
        />
        <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-glyph-invert-main">
          <Icon
            iconSet="16-technical"
            iconName="sbs-decorator"
            className="h-4 w-4 text-glyph-invert-main"
          />
        </div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 bg-glyph-primary-on-pic" />
    </div>
  );
};
