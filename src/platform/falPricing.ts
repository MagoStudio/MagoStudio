/** Display historical personal-key queue costs without retaining provider pricing. */
const SMALL_PRICE_THRESHOLD = 0.1;
const SMALL_PRICE_DECIMALS = 4;
export const formatFalCost = (value: number): string =>
  `$${value.toFixed(value < SMALL_PRICE_THRESHOLD ? SMALL_PRICE_DECIMALS : 2)} est.`;
