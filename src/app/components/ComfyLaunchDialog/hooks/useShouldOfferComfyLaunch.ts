import { useComfyLaunchStatus } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";

export const useShouldOfferComfyLaunch = ({
  isComfyLaunchStatusNeeded = true
}: { isComfyLaunchStatusNeeded?: boolean } = {}) => {
  const comfyLaunchStatus = useComfyLaunchStatus({ isComfyLaunchStatusNeeded });
  const isComfyStoppedWithKnownLauncher =
    comfyLaunchStatus.data?.available === false &&
    comfyLaunchStatus.data.canLaunch === true;
  return { shouldOfferComfyLaunch: isComfyStoppedWithKnownLauncher };
};
