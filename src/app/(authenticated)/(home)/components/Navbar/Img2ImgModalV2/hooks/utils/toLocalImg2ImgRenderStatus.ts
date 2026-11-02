import { Img2ImgRenderStatus } from "@models/img2img/types";

const PERCENT_PER_PROGRESS_FRACTION = 100;

const LOCAL_QUEUE_STATUS_TO_IMG2IMG_RENDER_STATUS: Record<
  string,
  Img2ImgRenderStatus
> = {
  FINISHED: Img2ImgRenderStatus.SUCCESS,
  ERROR: Img2ImgRenderStatus.FAILED,
  CANCELLED: Img2ImgRenderStatus.CANCELLED,
  INPROGRESS: Img2ImgRenderStatus.RUNNING
};

export interface LocalImg2ImgRenderStatus {
  data: Record<string, unknown>;
  progress: number;
  render_status: Img2ImgRenderStatus;
}

export const toLocalImg2ImgRenderStatus = (localQueueItem: {
  status: unknown;
  progress?: unknown;
  data?: unknown;
}): LocalImg2ImgRenderStatus => {
  const progressPercent = Number(localQueueItem.progress ?? 0);
  return {
    data: (localQueueItem.data ?? {}) as Record<string, unknown>,
    progress: Number.isFinite(progressPercent)
      ? progressPercent / PERCENT_PER_PROGRESS_FRACTION
      : 0,
    render_status:
      LOCAL_QUEUE_STATUS_TO_IMG2IMG_RENDER_STATUS[
        String(localQueueItem.status)
      ] ?? Img2ImgRenderStatus.QUEUED
  };
};
