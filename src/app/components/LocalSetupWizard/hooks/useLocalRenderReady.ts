import { VideoEngine } from "@models/video/types";
import { useQuery } from "@tanstack/react-query";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";
const SLOW_RENDER_STEPS = 8;

export const useLocalVideoReady = (
  model: VideoEngine,
  settings: Record<string, unknown>
) => {
  const enabled = isComfyLocalVideoModel(model);
  const result = useQuery({
    queryKey: ["local-video-setup", model, settings],
    queryFn: () =>
      window.mago.comfy.modelStatus({
        model: model as Parameters<
          typeof window.mago.comfy.modelStatus
        >[0]["model"],
        settings
      }),
    enabled,
    retry: false,
    refetchInterval: 5000
  });
  return !enabled || (!result.isError && result.data?.ready === true);
};

export const useLocalShotsReady = (enabled: boolean, steps: number) => {
  const result = useQuery({
    queryKey: ["local-script-setup"],
    queryFn: () => window.mago.comfy.scriptSetupStatus(),
    enabled,
    retry: false,
    refetchInterval: 5000
  });
  return (
    !enabled ||
    (!result.isError &&
      result.data?.ready === true &&
      (steps !== SLOW_RENDER_STEPS ||
        result.data.highQuality.every((item) => item.status === "installed")))
  );
};
