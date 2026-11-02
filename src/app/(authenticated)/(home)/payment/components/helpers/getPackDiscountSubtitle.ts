import { TFunction } from "i18next";

const packDiscountByCredits: Record<number, number | undefined> = {
  10000: undefined,
  30000: 7,
  90000: 15
};

export const getPackDiscountSubtitle = (
  credits: number,
  t: TFunction
): string | undefined => {
  const discount = packDiscountByCredits[credits];
  if (discount === undefined) return undefined;
  return t("payment.pack_discount.description", { discount });
};
