"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { i18n } from "@config/i18n";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

export default function UnauthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/") {
      router.push("/sign-up");
    }
  }, [pathname, router]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
