import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { snapNumberToStep } from "@domains/scriptProject/utils/snapNumberToStep";
import { useDraftValue } from "@hooks/useDraftValue";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  endCaption?: string;
  isDisabled: boolean;
  onSave: (nextValue: number) => void;
  testId?: string;
};

export const ShotSequentialNumberInput: React.FC<Props> = ({
  label,
  value,
  min,
  max,
  step,
  endCaption,
  isDisabled,
  onSave,
  testId
}) => {
  const savedValue = String(value);
  const {
    draftValue: draftNumber,
    setDraftValue: setDraftNumber,
    isDraftDirty: hasUnsavedNumber
  } = useDraftValue(savedValue);

  const commitNumber = () => {
    if (!hasUnsavedNumber) return;

    const parsedNumber = Number(draftNumber);
    const isWithinRange =
      Number.isFinite(parsedNumber) &&
      parsedNumber >= min &&
      parsedNumber <= max;
    if (!isWithinRange) {
      setDraftNumber(savedValue);
      return;
    }

    const snappedNumber = snapNumberToStep({ value: parsedNumber, min, step });
    if (snappedNumber !== parsedNumber) setDraftNumber(String(snappedNumber));

    onSave(snappedNumber);
  };

  return (
    <label className="flex flex-col gap-1">
      <Text variant="xs" color="glyph-secondary">
        {label}
      </Text>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={isDisabled}
        value={draftNumber}
        endCaption={endCaption}
        onChange={(event) => setDraftNumber(event.target.value)}
        onBlur={commitNumber}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitNumber();
          if (event.key === "Escape") setDraftNumber(savedValue);
        }}
        data-testid={testId}
      />
    </label>
  );
};
