import { useBalance } from "@domains/payment/useBalance";
import { selectMaxFrameRange } from "@domains/payment/utils/selectMaxFrameRange";

export const usePlanMaxFrameRange = (): number | undefined => {
  const { data } = useBalance(selectMaxFrameRange);
  return data;
};
