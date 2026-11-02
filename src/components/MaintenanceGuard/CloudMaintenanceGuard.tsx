import { CloudUnavailableNotice } from "@app/components/CloudReady/CloudUnavailableNotice";
import { useMagoState } from "@domains/app/useMagoState";
import { useTranslation } from "react-i18next";

type Props = {
  children: React.ReactNode;
};

export const CloudMaintenanceGuard: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation();
  const { data: magoState, refetch: refetchMagoState } = useMagoState();
  const isCloudReleaseOngoing = magoState?.["release-ongoing"] ?? false;

  if (!isCloudReleaseOngoing) return <>{children}</>;

  return (
    <CloudUnavailableNotice
      data-testid="cloud-maintenance-notice"
      message={t("titles.cloud_maintenance.label")}
      onRetry={() => void refetchMagoState()}
    />
  );
};
