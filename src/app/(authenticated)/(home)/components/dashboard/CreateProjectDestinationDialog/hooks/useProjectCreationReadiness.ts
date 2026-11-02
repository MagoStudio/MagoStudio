import { useLocalModelGroupsStatus } from "@app/components/LocalSetupWizard/hooks/useLocalModelGroupsStatus";
import { useProjectCreationAvailability } from "@domains/project/useProjectCreationAvailability";

const INSTALL_STATUS_REFETCH_MS = 5000;

export const useProjectCreationReadiness = () => {
  const { availability } = useProjectCreationAvailability();
  const { data: installStatus, isError: hasInstallStatusFailed } =
    useLocalModelGroupsStatus({
      isLocalModelGroupsStatusNeeded: availability.local,
      refetchIntervalMs: INSTALL_STATUS_REFETCH_MS
    });
  const isLocalRenderingInstalled =
    !!installStatus &&
    !hasInstallStatusFailed &&
    (!installStatus.isGetStartedInstall ||
      installStatus.groups.some(
        (group) => group.groupId === "minimal" && group.state === "installed"
      ));
  return {
    isLocalProjectCreationReady:
      availability.local && isLocalRenderingInstalled,
    isCloudProjectCreationReady: availability.cloud
  };
};
