import { faker } from "@faker-js/faker";
import { SubscriptionType } from "@schemas/balance";
import { PriceOption, PaymentType } from "@schemas/price";

const createPaymentPrice = (overrides?: Partial<PriceOption>): PriceOption => {
  const defaultPaymentPrice: PriceOption = {
    id: faker.string.uuid(),
    payment_type: PaymentType.PAYMENT,
    price: 5500,
    currency: "eur",
    credits: 90000,
    discount: 80,
    features: {
      simultaneous_image_renders: 0,
      simultaneous_video_renders: 0,
      maximum_frame_range: 0
    }
  };

  return {
    ...defaultPaymentPrice,
    ...overrides
  };
};

const createSubscriptionPrice = (
  overrides?: Partial<PriceOption>
): PriceOption => {
  const defaultSubscriptionPrice: PriceOption = {
    id: faker.string.uuid(),
    payment_type: PaymentType.SUBSCRIPTION,
    price: 900,
    currency: "eur",
    credits: 500,
    discount: 0,
    features: {
      title: SubscriptionType.UNLIMITED_BASIC,
      simultaneous_image_renders: 1,
      simultaneous_video_renders: 1,
      maximum_frame_range: 100
    }
  };

  return {
    ...defaultSubscriptionPrice,
    ...overrides
  };
};

export const createDefaultPaymentPrices = (): PriceOption[] => [
  createPaymentPrice({
    id: faker.string.uuid(),
    price: 5500,
    credits: 90000,
    discount: 80
  }),
  createPaymentPrice({
    id: faker.string.uuid(),
    price: 2500,
    credits: 30000,
    discount: 75
  }),
  createPaymentPrice({
    id: faker.string.uuid(),
    price: 1000,
    credits: 10000,
    discount: 70
  })
];

export const createDefaultSubscriptionPrices = (): PriceOption[] => [
  createSubscriptionPrice({
    id: faker.string.uuid(),
    price: 900,
    credits: 500,
    features: {
      title: SubscriptionType.UNLIMITED_BASIC,
      simultaneous_image_renders: 1,
      simultaneous_video_renders: 1,
      maximum_frame_range: 100
    }
  }),
  createSubscriptionPrice({
    id: faker.string.uuid(),
    price: 3500,
    credits: 15000,
    features: {
      title: SubscriptionType.UNLIMITED_PRO,
      simultaneous_image_renders: 2,
      simultaneous_video_renders: 2,
      maximum_frame_range: 300
    }
  }),
  createSubscriptionPrice({
    id: faker.string.uuid(),
    price: 15000,
    currency: "usd",
    credits: 40000,
    features: {
      title: SubscriptionType.UNLIMITED_STUDIO,
      simultaneous_image_renders: 2,
      simultaneous_video_renders: 2,
      maximum_frame_range: 300
    }
  }),
  createSubscriptionPrice({
    id: faker.string.uuid(),
    price: 12000,
    currency: "usd",
    credits: 40000,
    features: {
      title: SubscriptionType.UNLIMITED_STUDIO_ANNUAL,
      annual: true,
      simultaneous_image_renders: 2,
      simultaneous_video_renders: 2,
      maximum_frame_range: 300
    }
  })
];
