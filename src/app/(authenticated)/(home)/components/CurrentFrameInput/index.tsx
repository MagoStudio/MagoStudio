import { Input, type InputProps } from "@components/Input";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { isPlayingAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

interface Props extends InputProps {
  disabled?: boolean;
  currentFrame: number;
  setCurrentFrame: (frameNumber: number) => void;
  className?: string;
}

export const CurrentFrameInput: React.FC<Props> = ({
  disabled,
  currentFrame,
  setCurrentFrame,
  ...rest
}) => {
  const selectedProjectId = useSelectedProjectId();
  const isPlaying = useAtomValue(isPlayingAtom);
  const shotMaxFrames = useShotMaxFrames();

  const handleInputChange = (value: number) => {
    if (value < 0) {
      return;
    }
    if (value > shotMaxFrames) {
      return;
    }
    if (isPlaying) {
      return;
    }
    setCurrentFrame(value);
  };

  const displayValue = currentFrame ?? 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleInputChange(displayValue - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleInputChange(displayValue + 1);
    }
  };

  return (
    <Input
      disabled={isPlaying || disabled}
      max={shotMaxFrames}
      min={0}
      onFocus={() => {
        trackingWithProjectId.timelineActions.currentFrame(
          selectedProjectId,
          currentFrame
        );
      }}
      onChange={(e) => {
        if (e.target.value.trim() === "") {
          return;
        }

        const parsedValue = Number(e.target.value);
        if (Number.isNaN(parsedValue)) {
          return;
        }

        handleInputChange(parsedValue);
      }}
      onBlur={(e) => {
        if (e.target.value.trim() === "") {
          handleInputChange(0);
          return;
        }

        const parsedValue = Number(e.target.value);
        if (!Number.isNaN(parsedValue)) {
          handleInputChange(parsedValue);
        }
      }}
      onKeyDown={handleKeyDown}
      preserveEmptyWhileFocused
      textAlign="center"
      type="number"
      value={displayValue}
      selectAllTextOnFocus
      aria-label="Current Frame Input"
      {...rest}
    />
  );
};
