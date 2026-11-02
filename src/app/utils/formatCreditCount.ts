const CREDIT_COUNT_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

export const formatCreditCount = (value: number | string): string => {
  if (typeof value === "string" && value.trim() === "") {
    return value;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return typeof value === "string" ? value : "";
  }

  return CREDIT_COUNT_FORMATTER.format(numericValue);
};
