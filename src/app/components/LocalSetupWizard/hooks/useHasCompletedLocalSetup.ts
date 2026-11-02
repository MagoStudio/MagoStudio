import { useQuery } from "@tanstack/react-query";

export const useHasCompletedLocalSetup = (): boolean => {
  const install = useQuery({
    queryKey: ["starter-installer"],
    queryFn: () => window.mago.localSetup.installerStatus(),
    enabled: typeof window.mago?.localSetup?.installerStatus === "function",
    retry: false
  });
  return (
    install.data?.hasCompletedInstall === true || install.data?.phase === "done"
  );
};
