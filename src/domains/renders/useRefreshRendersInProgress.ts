import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

export const useRefreshRendersInProgress = () => {
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const queryClient = useQueryClient();
  const refreshRendersInProgressIfNeeded = async () => {
    if (isUnlimitedModeActive) {
      await queryClient.refetchQueries({
        queryKey: queryKeys.balance.all
      });
    }
  };
  return {
    refreshRendersInProgressIfNeeded
  };
};
