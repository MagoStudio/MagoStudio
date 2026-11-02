import { MAX_CREDITS_MODE } from "@config/constants";
import { TFunction } from "i18next";

interface FaqItem {
  id?: number;
  title: string;
  content: { text: string }[];
}

export const getPaymentFaqData = (t: TFunction): FaqItem[] => {
  return [
    {
      id: 1,
      title: t("payment.faq_disclosure_01.title"),
      content: [
        {
          text: t("payment.faq_disclosure_01.paragraph_01")
        },
        {
          text: t("payment.faq_disclosure_01.paragraph_02")
        },
        {
          text: t("payment.faq_disclosure_01.paragraph_03", {
            count: MAX_CREDITS_MODE
          })
        }
      ]
    },
    {
      id: 2,
      title: t("payment.faq_disclosure_02.title"),
      content: [
        {
          text: t("payment.faq_disclosure_02.paragraph_01")
        }
      ]
    },
    {
      id: 3,
      title: t("payment.faq_disclosure_03.title"),
      content: [
        {
          text: t("payment.faq_disclosure_03.paragraph_01")
        }
      ]
    },
    {
      id: 4,
      title: t("payment.faq_disclosure_04.title"),
      content: [
        {
          text: t("payment.faq_disclosure_04.paragraph_01", {
            discord: "<link=discord>",
            email: "<link=email>"
          })
        }
      ]
    }
  ];
};
