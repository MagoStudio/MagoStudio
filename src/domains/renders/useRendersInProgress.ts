import { useFetchBalance } from "@domains/payment/useFetchBalance";
import { Balance } from "@schemas/balance";
export const useRendersInProgress = () => {
  const select = (data: Balance) => {
    return data.renders_in_progress ?? null;
  };
  return useFetchBalance(select);
};
