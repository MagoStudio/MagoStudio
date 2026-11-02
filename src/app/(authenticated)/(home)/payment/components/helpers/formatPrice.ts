import { PRICE_CENTS_DIVISOR } from "@config/constants";

export const formatPrice = (price: number): string => {
  return (price / PRICE_CENTS_DIVISOR).toLocaleString("en-US");
};

const DIVISOR = 100;
export const formatPriceBeforeDiscount = (
  price: number,
  discount: number
): string => {
  return (
    price /
    PRICE_CENTS_DIVISOR /
    (1 - discount / DIVISOR)
  ).toLocaleString("en-US");
};
