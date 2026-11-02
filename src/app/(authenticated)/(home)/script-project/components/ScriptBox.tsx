import { cn } from "@utils";
import { forwardRef } from "react";

type Props = {
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** The Agent's script, shown as a tall reading surface rather than a form field. Not a variant of
 * the shared `Textarea`: it carries no hover state and no focus outline, matching the design
 * reference, so a keyboard user loses the usual cue for where they are — carried deliberately. */
export const ScriptBox = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-w-0 cursor-text resize-none appearance-none rounded border border-element-primary bg-element-primary p-20",
        "font-screenplay text-[14px] font-normal text-glyph-primary placeholder:text-glyph-tertiary",
        "scrollbar-custom outline-none",
        "disabled:pointer-events-none disabled:text-glyph-disabled disabled:select-none disabled:placeholder:text-glyph-disabled",
        className
      )}
      {...props}
    />
  )
);

ScriptBox.displayName = "ScriptBox";
