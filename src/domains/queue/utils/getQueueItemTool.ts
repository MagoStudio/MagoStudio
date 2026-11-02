import { getToolForEngine } from "@hooks/tool/getToolForEngine";
import type { Tool } from "@hooks/tool/useTool";
import { VideoEngine } from "@models/video/types";
import { LayerType } from "@schemas/layer";

export const getQueueItemTool = ({
  kind,
  trackType,
  engine
}: {
  kind: "image" | "video" | undefined;
  trackType: LayerType | undefined;
  engine: VideoEngine | undefined;
}): Tool => {
  if (kind === "image" || trackType === LayerType.IMG2IMG) return "edit-frame";
  return getToolForEngine(engine);
};
