import { z } from "zod";

import { SubscriptionFeatures } from "./balance";

export enum PaymentType {
  PAYMENT = "payment",
  SUBSCRIPTION = "subscription"
}

const PriceOptionSchema = z.object({
  id: z.string(),
  payment_type: z.enum(PaymentType),
  price: z.number(),
  credits: z.number(),
  discount: z.number(),
  conditional_discount: z.number().optional(),
  currency: z.string(),
  features: SubscriptionFeatures
});
export type PriceOption = z.infer<typeof PriceOptionSchema>;
