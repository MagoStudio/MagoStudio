import { DisclosureIconButton } from "@components/DisclosureIconButton";
import { Text } from "@components/Text";
import { EMAILS, MEDIA_RESOURCES } from "@config/companyData";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from "@headlessui/react";
import { getPaymentFaqData } from "@home/payment/components/helpers/getPaymentFaqData";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

function parseTextWithLinks(text: string, t: TFunction): React.ReactNode[] {
  const parts = text.split(/(<link=\w+>)/g);
  return parts.map((part, index) => {
    if (part === "<link=discord>") {
      return (
        <a
          key={index}
          className="underline"
          href={MEDIA_RESOURCES.DISCORD_COMMUNITY}
          rel="noreferrer"
          target="_blank"
        >
          {t("titles.discord.label")}
        </a>
      );
    }

    if (part === "<link=email>") {
      return (
        <a
          key={index}
          className="underline"
          href={`mailto:${EMAILS.SUPPORT_EMAIL}`}
          rel="noreferrer"
          target="_blank"
        >
          {t("titles.email.label")}
        </a>
      );
    }

    return part;
  });
}

export const PaymentFaq: React.FC = () => {
  const { t } = useTranslation();

  const faqItems = getPaymentFaqData(t);

  return (
    <section className="flex flex-col gap-5 p-8 w-full rounded-3xl bg-card-gradient shadow-payment-card backdrop-blur-md">
      <div>
        <Text component="h3" select="none" variant="xl" weight="bold">
          {t("payment.faq_title.title")}
        </Text>
      </div>
      {faqItems.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 p-8 rounded-2xl bg-element-on-image"
        >
          <Disclosure>
            {({ open }) => (
              <div>
                <DisclosureButton className="flex gap-4 items-center justify-between">
                  <Text align="left" variant="lg" select="none">
                    {item.title}
                  </Text>
                  <DisclosureIconButton
                    color="glyph-primary-on-pic"
                    open={open}
                  />
                </DisclosureButton>
                <DisclosurePanel>
                  <div className="flex flex-col gap-3 pt-2 w-full">
                    {item.content.map((paragraph, paragraphIndex) => {
                      const hasLinks = paragraph.text.includes("<link=");
                      return (
                        <Text
                          key={paragraphIndex}
                          color="glyph-secondary"
                          variant="md"
                          whiteSpace="pre-line"
                        >
                          {hasLinks
                            ? parseTextWithLinks(paragraph.text, t)
                            : paragraph.text}
                        </Text>
                      );
                    })}
                  </div>
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        </div>
      ))}
    </section>
  );
};
