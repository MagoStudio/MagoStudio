import { PriceOption } from "@schemas/price";

export interface DiscountedPrice {
  original: number;
  discounted: number;
}

const PERCENT_DIVISOR = 100;

export const getDiscountedPrice = (
  price: Pick<PriceOption, "price" | "conditional_discount">
): DiscountedPrice | undefined => {
  const conditionalDiscount = price.conditional_discount;
  if (conditionalDiscount === undefined) return undefined;

  return {
    original: price.price,
    discounted: price.price * (1 - conditionalDiscount / PERCENT_DIVISOR)
  };
};
