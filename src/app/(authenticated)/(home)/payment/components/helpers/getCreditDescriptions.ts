import { TFunction } from "i18next";

type CreditDescriptions = Record<number, { content: string[] }>;

export const getCreditDescriptions = (t: TFunction): CreditDescriptions => {
  return {
    10000: {
      content: [
        t("payment.credits_card_01.videos"),
        t("payment.credits_card_01.images"),
        t("payment.credits_card_01.price")
      ]
    },
    30000: {
      content: [
        t("payment.credits_card_02.videos"),
        t("payment.credits_card_02.images"),
        t("payment.credits_card_02.price")
      ]
    },
    90000: {
      content: [
        t("payment.credits_card_03.videos"),
        t("payment.credits_card_03.images"),
        t("payment.credits_card_03.price")
      ]
    }
  };
};
