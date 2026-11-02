import { LoadingIndicator } from "@components/LoadingIndicator";

export function PaymentLoader() {
  return (
    <div className="flex items-center justify-center col-span-full row-span-full h-[15rem] w-full">
      <LoadingIndicator />
    </div>
  );
}
