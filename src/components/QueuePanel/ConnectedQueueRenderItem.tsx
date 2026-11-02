import { QueueRenderItem } from "@components/QueueRenderItem/QueueRenderItem";
import { ROUTES } from "@config/constants";
import { getQueueStatusText } from "@domains/queue/utils/getQueueStatusText";
import { isImageToVideoModel } from "@domains/renders/utils/isImageToVideoModel";
import { useGetTrackById } from "@domains/track/useGetTrackById";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { getStatusColor } from "@home/components/status/getStatusColor";
import { type QueueItem } from "@hooks/queue/interface";
import { useDeleteQueueItem } from "@hooks/queue/useDeleteQueueItem";
import { useMarkQueueItemInteracted } from "@hooks/queue/useMarkQueueItemInteracted";
import { getToolForEngine } from "@hooks/tool/getToolForEngine";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";
import {
  trackingUtils,
  trackingWithProjectId
} from "@hooks/tracking/trackingUtils";
import { VideoEngine } from "@models/video/types";
import { AssetStatus } from "@schemas/asset";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

dayjs.extend(duration);

interface ConnectedQueueRenderItemProps {
  item: QueueItem;
  onClose: () => void;
}

export const ConnectedQueueRenderItem: React.FC<
  ConnectedQueueRenderItemProps
> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { mutateAsync: deleteQueueItem } = useDeleteQueueItem();
  const { mutate: markInteracted } = useMarkQueueItemInteracted();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: track } = useGetTrackById({
    trackId: item.layer_id,
    selectedProjectId: item.project_id,
    selectedShotId: item.timeline_id
  });
  const ETA = item.ETA !== undefined ? item.ETA * 1000 : undefined;

  const statusText = getQueueStatusText(item, ETA, t);
  const statusColor = getStatusColor(item.status);

  const renderDuration =
    item.status === AssetStatus.FINISHED
      ? dayjs
          .duration(
            new Date(item.finished_at).getTime() -
              new Date(item.render_started_at).getTime()
          )
          .format("HH:mm:ss")
      : undefined;

  const handleClick = () => {
    if (!item.project_id) return;
    if (
      item.status === AssetStatus.FINISHED &&
      item.interacted_with === false
    ) {
      markInteracted(item.id);
    }
    const engine = getTrackRenderSettings(track)?.mago_engine as
      | VideoEngine
      | undefined;
    const tool = getToolForEngine(engine);
    onClose();
    const isImageToVideo = isImageToVideoModel(engine);
    const basePath = isImageToVideo ? ROUTES.PROJECT_TIMELINE : ROUTES.PROJECT;
    const timelineParam = isImageToVideo
      ? ""
      : `&timelineId=${item.timeline_id}`;
    router.push(
      `${basePath}?projectId=${item.project_id}${timelineParam}&selectedTrackIds=${item.layer_id}&${TOOL_URL_PARAM}=${tool}`
    );
    trackingWithProjectId.queueActions.projectClick(item.project_id);
    if (isImageToVideo) {
      trackingUtils.imageToVideoActions.modalOpen({ source: "queue" });
    }
  };

  const handleDelete = () => {
    showToast({
      message: t("queue_panel.stop_render_confirmation.description", {
        name: item.layer_name
      }),
      onSubmit: async () => {
        await deleteQueueItem({ queueItemId: item.id });
        trackingUtils.renderActions.cancel(item.layer_name, item.asset_id);
        void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
      },
      onCancelText: t("actions.cancel.label"),
      onSubmitText: t("queue_panel.stop_render.label")
    });
  };

  return (
    <QueueRenderItem
      layerId={item.layer_id}
      projectName={item.project_name}
      shotName={item.timeline_name}
      trackName={item.layer_name}
      status={item.status}
      progress={item.progress}
      frameRange={item.frame_range}
      cost={item.price}
      costUnit={
        item.render_provider === "local-comfy"
          ? null
          : item.render_provider === "mago-cloud"
            ? "credits"
            : null
      }
      statusText={statusText}
      statusColor={statusColor}
      renderDuration={renderDuration}
      interactedWith={item.interacted_with}
      isCancelable={item.isCancelable}
      onClick={handleClick}
      onDelete={handleDelete}
    />
  );
};
