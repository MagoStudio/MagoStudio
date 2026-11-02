import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { CurrentFrameInput } from "@home/components/CurrentFrameInput";
import { cn } from "@utils";
import React from "react";

type Props = {
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export const FrameControls: React.FC<Props> = ({
  currentFrame,
  setCurrentFrame,
  onPrev,
  onNext,
  className
}) => (
  <div
    className={cn("flex items-center gap-1", className)}
    tabIndex={0}
    aria-label="Frame controls"
    onKeyDown={(event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        onPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        onNext();
      }
    }}
  >
    <IconActionButton
      aria-label="previous frame"
      icon={<Icon iconSet="16" iconName="chevron-left" />}
      variant="dark"
      size="sm"
      onPress={onPrev}
    />
    <CurrentFrameInput
      currentFrame={currentFrame}
      setCurrentFrame={setCurrentFrame}
      className="bg-element-primary w-24 h-8"
    />
    <IconActionButton
      aria-label="next frame"
      icon={<Icon iconSet="16" iconName="chevron-right" />}
      variant="dark"
      size="sm"
      onPress={onNext}
    />
  </div>
);
