import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { backendApiClient } from "@/lib/backend-api-client";

interface ChangeSubscriptionParams {
  subscriptionId: string;
  priceId: string;
}

async function changeSubscription({
  subscriptionId,
  priceId
}: ChangeSubscriptionParams): Promise<string> {
  const response = await backendApiClient.post<string>(
    `/change-subscription/${subscriptionId}`,
    { price_id: priceId }
  );
  return response.data;
}

export function useChangeSubscription() {
  const router = useRouter();

  return useMutation({
    mutationFn: (params: ChangeSubscriptionParams) => {
      return changeSubscription(params);
    },
    onSuccess: (portalUrl) => {
      router.push(portalUrl);
    },
    onError: (error) => {
      console.error("Failed to change subscription:", error);
    }
  });
}
