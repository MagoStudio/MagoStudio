"use client";

import { useTranslation } from "react-i18next";

interface PricingCustomSolutionContent {
  badgeLabel: string;
  title: string;
  description: string;
  checklist: string[];
}

interface PricingFAQItem {
  question: string;
  answer: string;
}

interface PricingContent {
  customSolution: PricingCustomSolutionContent;
  faq: PricingFAQItem[];
}

export const usePricingContent = (): {
  content: PricingContent;
  isLoading: boolean;
} => {
  const { t } = useTranslation();

  const content: PricingContent = {
    customSolution: {
      badgeLabel: t("titles.pricing_page.custom_solutions_badge"),
      title: t("titles.pricing_page.custom_solutions_title"),
      description: t("titles.pricing_page.custom_solutions_description"),
      checklist: [
        t("titles.pricing_page.checklist_item_1"),
        t("titles.pricing_page.checklist_item_2"),
        t("titles.pricing_page.checklist_item_3"),
        t("titles.pricing_page.checklist_item_4"),
        t("titles.pricing_page.checklist_item_5"),
        t("titles.pricing_page.checklist_item_6")
      ]
    },
    faq: [
      {
        question: t("titles.pricing_page.faq_q1"),
        answer: t("titles.pricing_page.faq_a1")
      },
      {
        question: t("titles.pricing_page.faq_q2"),
        answer: t("titles.pricing_page.faq_a2")
      },
      {
        question: t("titles.pricing_page.faq_q3"),
        answer: t("titles.pricing_page.faq_a3")
      },
      {
        question: t("titles.pricing_page.faq_q4"),
        answer: t("titles.pricing_page.faq_a4")
      }
    ]
  };

  return { content, isLoading: false };
};
