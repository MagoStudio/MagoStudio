import { getTrackErrorMessage } from "@domains/track/utils/getTrackErrorMessage";
import { Layer } from "@schemas/layer";

import {
  deriveFailedRenderTrack,
  ShotFailureReason
} from "./deriveShotCardState";

export const SHOT_FAILURE_MESSAGE_MAX_LENGTH = 300;

export interface ShotFailureOutcome {
  outcome: ShotFailureReason;
  message: string | undefined;
}

const collapseWhitespace = (message: string): string =>
  message.replace(/\s+/g, " ");

const truncateMessage = (message: string): string => {
  const codePoints = Array.from(message);
  return codePoints.length > SHOT_FAILURE_MESSAGE_MAX_LENGTH
    ? `${codePoints.slice(0, SHOT_FAILURE_MESSAGE_MAX_LENGTH).join("")}…`
    : message;
};

export const deriveShotFailureOutcome = (
  layers: Layer[]
): ShotFailureOutcome | undefined => {
  const failure = deriveFailedRenderTrack(layers);
  if (!failure) return undefined;

  const errorMessage: unknown = getTrackErrorMessage(failure.track);
  const hasMeaningfulMessage =
    typeof errorMessage === "string" && errorMessage.trim() !== "";
  const message = hasMeaningfulMessage
    ? truncateMessage(collapseWhitespace(errorMessage))
    : undefined;

  return {
    outcome: failure.reason,
    message
  };
};
