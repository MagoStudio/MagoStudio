const SECONDS_PER_MINUTE = 60;
const VIDEO_ESTIMATE_MINUTES = 8;
const WAN_ANIMATE_ESTIMATE_MINUTES = 10;
const WAN_VACE_ESTIMATE_MINUTES = 12;
const VIDEO_ESTIMATE_SECONDS = VIDEO_ESTIMATE_MINUTES * SECONDS_PER_MINUTE;
const MAX_ACTIVE_PROGRESS = 99;
const PERCENT_MULTIPLIER = 100;

const ESTIMATE_SECONDS_BY_MODEL: Record<string, number> = {
  gpt_image_2: 15,
  seedream_5_pro: 10,
  nanobanana_pro: 15,
  nanobanana_2: 15,
  qwen: 120,
  seedance_2: VIDEO_ESTIMATE_SECONDS,
  happy_horse_1: VIDEO_ESTIMATE_SECONDS,
  kling_o1: VIDEO_ESTIMATE_SECONDS,
  kling_o3_edit_pro: VIDEO_ESTIMATE_SECONDS,
  kling_2_6_motion_control: VIDEO_ESTIMATE_SECONDS,
  kling_3_motion_control: VIDEO_ESTIMATE_SECONDS,
  wan_animate_2_2: WAN_ANIMATE_ESTIMATE_MINUTES * SECONDS_PER_MINUTE,
  wan_vace_2_1: WAN_VACE_ESTIMATE_MINUTES * SECONDS_PER_MINUTE
};

export const getRenderEta = ({
  model,
  status,
  startedAt,
  now = new Date()
}: {
  model: string;
  status: string;
  startedAt: Date | null;
  now?: Date;
}): {
  ETA?: number;
  estimatedEndTime?: string;
  progress?: number;
} => {
  if (status !== "INPROGRESS" || !startedAt) return {};
  const estimateSeconds = ESTIMATE_SECONDS_BY_MODEL[model];
  if (!estimateSeconds) return {};

  const estimatedEndMs = startedAt.getTime() + estimateSeconds * 1000;
  const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
  return {
    ETA: Math.max(0, Math.floor((estimatedEndMs - now.getTime()) / 1000)),
    estimatedEndTime: new Date(estimatedEndMs).toISOString(),
    progress: Math.min(
      MAX_ACTIVE_PROGRESS,
      Math.max(0, (elapsedMs / (estimateSeconds * 1000)) * PERCENT_MULTIPLIER)
    )
  };
};
