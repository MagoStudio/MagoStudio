import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { backendApiClient } from "@/lib/backend-api-client";

interface CancelSubscriptionParams {
  subscriptionId: string;
}

async function cancelSubscription({
  subscriptionId
}: CancelSubscriptionParams): Promise<string> {
  const response = await backendApiClient.post<string>(
    `/cancel-subscription/${subscriptionId}`
  );
  return response.data;
}

export function useCancelSubscription() {
  const router = useRouter();

  return useMutation({
    mutationFn: (params: CancelSubscriptionParams) => {
      return cancelSubscription(params);
    },
    onSuccess: (cancelUrl) => {
      router.push(cancelUrl);
    },
    onError: (error) => {
      console.error("Failed to cancel subscription:", error);
    }
  });
}
