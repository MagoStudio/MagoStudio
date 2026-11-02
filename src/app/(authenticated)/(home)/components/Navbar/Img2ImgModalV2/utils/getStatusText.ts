import { Img2ImgRenderStatus } from "@models/img2img/types";

const IN_PROGRESS_STATUSES = [
  Img2ImgRenderStatus.CREATED,
  Img2ImgRenderStatus.NOT_STARTED,
  Img2ImgRenderStatus.RUNNING,
  Img2ImgRenderStatus.UPLOADING,
  Img2ImgRenderStatus.STARTED,
  Img2ImgRenderStatus.QUEUED
];

export const getStatusText = ({
  status,
  progress
}: {
  status?: string;
  progress?: number;
}) => {
  if (!status) {
    return "Loading...";
  }

  if (IN_PROGRESS_STATUSES.includes(status as Img2ImgRenderStatus)) {
    if (progress !== undefined && progress === 0) {
      return "Pending";
    }

    return "In Progress";
  }
  if (status === Img2ImgRenderStatus.SUCCESS) {
    return "Success";
  }

  if (status === Img2ImgRenderStatus.FAILED) {
    return "Generation failed";
  }

  if (status === Img2ImgRenderStatus.CANCELLED) {
    return "Cancelled";
  }

  if (status === Img2ImgRenderStatus.TIMEOUT) {
    return "Timeout";
  }

  return "Starting";
};
