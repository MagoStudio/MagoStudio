import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { DECIMAL_PRECISION } from "@constants";
import { ceilToPrecision, floorToPrecision } from "@utils";
import { useState } from "react";

interface Props {
  minInputMin: number;
  minInputMax: number;
  maxInputMin: number;
  maxInputMax: number;
  minTrimTime: number;
  maxTrimTime: number;
  handleMinTimeChange: (value: number) => void;
  handleMaxTimeChange: (value: number) => void;
  disabled?: boolean;
}

export const TrimmingInputs: React.FC<Props> = ({
  minTrimTime,
  maxTrimTime,
  handleMinTimeChange,
  handleMaxTimeChange,
  minInputMin,
  minInputMax,
  maxInputMin,
  maxInputMax,
  disabled = false
}) => {
  const [localMinValue, setLocalMinValue] = useState(minTrimTime);
  const [localMaxValue, setLocalMaxValue] = useState(maxTrimTime);
  const [lastMinTrimTime, setLastMinTrimTime] = useState(minTrimTime);
  const [lastMaxTrimTime, setLastMaxTrimTime] = useState(maxTrimTime);

  if (minTrimTime !== lastMinTrimTime) {
    setLastMinTrimTime(minTrimTime);
    setLocalMinValue(minTrimTime);
  }
  if (maxTrimTime !== lastMaxTrimTime) {
    setLastMaxTrimTime(maxTrimTime);
    setLocalMaxValue(maxTrimTime);
  }

  return (
    <div className="flex flex-row items-center gap-1 shrink-0">
      <div className="flex flex-row items-center gap-1">
        <div className="relative w-24 shrink-0">
          <Input
            type="number"
            step={1 / DECIMAL_PRECISION}
            id="min-trim-time"
            min={minInputMin}
            max={minInputMax}
            value={floorToPrecision(localMinValue, DECIMAL_PRECISION)}
            onChange={(e) => setLocalMinValue(Number(e.target.value))}
            onBlur={(e) => handleMinTimeChange(Number(e.target.value))}
            endCaption="sec."
            disabled={disabled}
          />
        </div>
        <Text variant="sm" color="glyph-tertiary">
          -
        </Text>
        <div className="relative w-24 shrink-0">
          <Input
            type="number"
            step="0.1"
            id="max-trim-time"
            min={maxInputMin}
            max={maxInputMax}
            value={ceilToPrecision(localMaxValue, DECIMAL_PRECISION)}
            onChange={(e) => setLocalMaxValue(Number(e.target.value))}
            onBlur={(e) => handleMaxTimeChange(Number(e.target.value))}
            endCaption="sec."
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
