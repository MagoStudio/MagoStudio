import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { AssetStatus } from "@schemas/asset";
import { Layer, LayerType } from "@schemas/layer";

export type ShotCardState = "notStarted" | "rendering" | "failed" | "ready";
export type ShotFailureReason = "errored" | "cancelled";

export interface FailedRenderTrack {
  track: Layer;
  reason: ShotFailureReason;
}

interface RenderTrackClassification {
  state: ShotCardState;
  failure: FailedRenderTrack | undefined;
}

const hasPlayableClip = (track: Layer): boolean =>
  !!getTrackClip(track) && isTrackAssetFinished(track);

const toFailureReason = (track: Layer): ShotFailureReason | undefined => {
  const queueStatus = getTrackAssetData(track)?.queue_status;
  if (queueStatus === AssetStatus.ERROR) return "errored";
  if (queueStatus === AssetStatus.CANCELLED) return "cancelled";
  return undefined;
};

const FAILURE_REASON_PRECEDENCE: ShotFailureReason[] = ["errored", "cancelled"];

const findFailedRenderTrack = (
  renderTracks: Layer[]
): FailedRenderTrack | undefined => {
  for (const reason of FAILURE_REASON_PRECEDENCE) {
    const track = renderTracks.find(
      (candidate) => toFailureReason(candidate) === reason
    );
    if (track) return { track, reason };
  }
  return undefined;
};

const classifyRenderTracks = (layers: Layer[]): RenderTrackClassification => {
  const renderTracks = layers.filter(
    (layer) => layer.type === LayerType.RENDER
  );

  if (renderTracks.length === 0) {
    return { state: "notStarted", failure: undefined };
  }
  if (renderTracks.some(hasPlayableClip)) {
    return { state: "ready", failure: undefined };
  }

  const failure = findFailedRenderTrack(renderTracks);
  if (failure) {
    return { state: "failed", failure };
  }
  return { state: "rendering", failure: undefined };
};

export const deriveShotCardState = (layers: Layer[]): ShotCardState =>
  classifyRenderTracks(layers).state;

export const deriveFailedRenderTrack = (
  layers: Layer[]
): FailedRenderTrack | undefined => classifyRenderTracks(layers).failure;
