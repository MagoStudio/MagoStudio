import { useBalance } from "@domains/payment/useBalance";
import { PaymentLoader } from "@home/payment/components/PaymentLoader";
import { PaymentTabSection } from "@home/payment/components/PaymentTabSection";
import { SubscriptionsTable } from "@home/payment/components/subscriptionsTable/SubscriptionsTable";

export const PaymentSubscriptionsTab: React.FC = () => {
  const { isLoading: isBalanceLoading } = useBalance();

  if (isBalanceLoading) {
    return (
      <PaymentTabSection>
        <PaymentLoader />
      </PaymentTabSection>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <SubscriptionsTable />
    </div>
  );
};
