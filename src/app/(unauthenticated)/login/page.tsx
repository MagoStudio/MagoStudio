"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return null;
}
