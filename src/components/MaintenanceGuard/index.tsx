"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useMagoState } from "@domains/app/useMagoState";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export const MaintenanceGuard: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: magoState, isPending } = useMagoState();

  const isMaintenancePage = pathname?.startsWith("/maintenance") ?? false;
  const isReleaseOngoing = magoState?.["release-ongoing"] ?? false;

  useEffect(() => {
    if (!magoState) return;

    if (isReleaseOngoing && !isMaintenancePage) {
      router.replace("/maintenance");
    }

    if (!isReleaseOngoing && isMaintenancePage) {
      router.replace("/");
    }
  }, [isReleaseOngoing, isMaintenancePage, router, magoState]);

  if (isPending) {
    return null;
  }

  if (isReleaseOngoing && !isMaintenancePage) {
    return null;
  }

  return <>{children}</>;
};
