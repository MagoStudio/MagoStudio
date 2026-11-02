"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { ROUTES } from "@config/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.PAYMENT_MAIN_PAGE);
  }, [router]);

  return null;
}
