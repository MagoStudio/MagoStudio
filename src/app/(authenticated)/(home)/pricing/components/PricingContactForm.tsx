import { Widget } from "@typeform/embed-react";
const TYPEFORM_FORM_ID = process.env.NEXT_PUBLIC_TYPEFORM_FORM_ID;

export function PricingContactForm() {
  if (!TYPEFORM_FORM_ID) return null;

  return (
    <div
      id="contact-form"
      className="flex flex-1 flex-col items-center px-8 py-14 rounded-br-[20px] rounded-tr-[20px] backdrop-blur-lg bg-surface-primary shadow-payment-card overflow-hidden"
    >
      <div
        className="w-full h-full min-h-[700px]"
        style={{ transform: "scale(0.9)" }}
      >
        <Widget id={TYPEFORM_FORM_ID} className="w-full h-full" />
      </div>
    </div>
  );
}
