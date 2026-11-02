export const snapNumberToStep = ({
  value,
  min,
  step
}: {
  value: number;
  min: number;
  step: number;
}): number => {
  const stepsFromMin = Math.round((value - min) / step);
  const snappedValue = min + stepsFromMin * step;
  const decimalPlaces = (String(step).split(".")[1] ?? "").length;

  return Number(snappedValue.toFixed(decimalPlaces));
};
