import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { backendApiClient } from "@/lib/backend-api-client";
import { openExternalUrl } from "@/platform/cloudAccount";

interface CreateCheckoutSessionParams {
  priceId: string;
  addCoupon?: boolean;
}

async function createCheckoutSession({
  priceId,
  addCoupon
}: CreateCheckoutSessionParams): Promise<string> {
  const response = await backendApiClient.post<string>(
    `/create-checkout-session/${priceId}`,
    addCoupon ? { add_coupon: true } : undefined
  );
  return response.data;
}

export function useCreateCheckoutSession() {
  const router = useRouter();

  return useMutation({
    mutationFn: (params: CreateCheckoutSessionParams) => {
      return createCheckoutSession(params);
    },
    onSuccess: (checkoutUrl) => {
      openExternalUrl(checkoutUrl);
    },
    onError: (error) => {
      console.error("Failed to create checkout session:", error);
    }
  });
}
