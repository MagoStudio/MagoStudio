import { useComfyLaunchStatus } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";

export const useIsComfyRespondingSinceFailedCheck = ({
  isWaitingForComfyToRespond,
  failedCheckSubmittedAtMs
}: {
  isWaitingForComfyToRespond: boolean;
  failedCheckSubmittedAtMs: number;
}) => {
  const comfyLaunchStatus = useComfyLaunchStatus({
    isComfyLaunchStatusNeeded: isWaitingForComfyToRespond
  });
  const isComfyRespondingSinceFailedCheck =
    comfyLaunchStatus.data?.available === true &&
    comfyLaunchStatus.dataUpdatedAt > failedCheckSubmittedAtMs;
  return isWaitingForComfyToRespond && isComfyRespondingSinceFailedCheck;
};
