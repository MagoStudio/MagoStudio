import { fetchBalance } from "@domains/payment/api/fetchBalance";
import {
  MILLISECONDS_TO_SECONDS,
  MINUTES_TO_SECONDS,
  STALE_TIME_MINUTES
} from "@domains/payment/constants";
import { Balance } from "@schemas/balance";
import { useQuery } from "@tanstack/react-query";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { queryKeys } from "@/queryKeys";

export const useFetchBalance = <TData = Balance>(
  select?: (data: Balance) => TData,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: queryKeys.balance.all,
    queryFn: () => fetchBalance(),
    refetchOnWindowFocus: true,
    select,
    // Credits belong to the account: available in a signed-in desktop app,
    // never fetched when the user chose to work offline.
    enabled: enabled && isCloudAccountActive(),
    staleTime: MILLISECONDS_TO_SECONDS * MINUTES_TO_SECONDS * STALE_TIME_MINUTES
  });
};
