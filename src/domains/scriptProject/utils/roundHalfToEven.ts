const HALFWAY_FRACTION = 0.5;

export const roundHalfToEven = (value: number): number => {
  const flooredValue = Math.floor(value);
  const fractionalPart = value - flooredValue;

  if (fractionalPart < HALFWAY_FRACTION) return flooredValue;
  if (fractionalPart > HALFWAY_FRACTION) return flooredValue + 1;

  return flooredValue % 2 === 0 ? flooredValue : flooredValue + 1;
};
