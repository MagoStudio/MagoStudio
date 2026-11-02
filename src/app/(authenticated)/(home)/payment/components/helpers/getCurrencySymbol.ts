export const getCurrencySymbol = (currency?: string): string => {
  return currency?.toLowerCase() === "eur" ? "€" : "$";
};
