import { SubscriptionsTableFooter } from "../subscriptionsTable/SubscriptionsTableFooter";

export function PaymentTabSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <section className="relative m-auto w-full lg:max-w-[var(--breakpoint-xl)] min-w-[64rem]">
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-1 gap-6 h-full">
          {children}
        </div>
      </section>
      <section className="relative m-auto w-full lg:max-w-[var(--breakpoint-xl)] min-w-[64rem] pt-7">
        <SubscriptionsTableFooter />
      </section>
    </div>
  );
}
