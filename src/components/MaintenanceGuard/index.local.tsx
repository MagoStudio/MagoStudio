import { isCloudAccountActive } from "@/platform/cloudAccount";

import { CloudMaintenanceGuard } from "./CloudMaintenanceGuard";

type Props = {
  children: React.ReactNode;
};

export const MaintenanceGuard: React.FC<Props> = ({ children }) => {
  if (!isCloudAccountActive()) return <>{children}</>;
  return <CloudMaintenanceGuard>{children}</CloudMaintenanceGuard>;
};
