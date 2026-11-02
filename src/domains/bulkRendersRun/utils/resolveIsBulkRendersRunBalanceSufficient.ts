export const resolveIsBulkRendersRunBalanceSufficient = ({
  couldNotBePriced,
  balanceAmount,
  estimatedRemainingCredits
}: {
  couldNotBePriced: boolean;
  balanceAmount: number | undefined;
  estimatedRemainingCredits: number;
}): boolean => {
  if (couldNotBePriced) return true;
  if (balanceAmount === undefined) return true;
  return balanceAmount >= estimatedRemainingCredits;
};
