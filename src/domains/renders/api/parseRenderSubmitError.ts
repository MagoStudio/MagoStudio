import {
  HTTP_PAYMENT_REQUIRED,
  INSUFFICIENT_BALANCE_RENDER_MESSAGE
} from "@domains/renders/utils/insufficientBalanceRenderMessage";
import { readAxiosErrorBody } from "@domains/renders/utils/readAxiosErrorBody";
import axios from "axios";

export enum RenderSubmitErrorKind {
  SubscriptionNotActive = "subscription_not_active",
  ModeNotAvailable = "mode_not_available",
  ModelNotAvailable = "model_not_available",
  MaxRenderCount = "max_render_count",
  MaxFrameRange = "max_frame_range",
  DailyLimit = "daily_limit",
  WeeklyLimit = "weekly_limit",
  InsufficientBalance = "insufficient_balance",
  Unknown = "unknown"
}

export interface RenderSubmitError {
  kind: RenderSubmitErrorKind;
  message?: string;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;

export function parseRenderSubmitError(error: unknown): RenderSubmitError {
  if (!axios.isAxiosError(error))
    return { kind: RenderSubmitErrorKind.Unknown };

  const status = error.response?.status;
  const message = readAxiosErrorBody(error.response?.data);
  const lower = message.toLowerCase();

  if (status === HTTP_PAYMENT_REQUIRED) {
    return {
      kind: RenderSubmitErrorKind.InsufficientBalance,
      message: INSUFFICIENT_BALANCE_RENDER_MESSAGE
    };
  }

  if (status === HTTP_TOO_MANY_REQUESTS) {
    if (lower.includes("weekly"))
      return { kind: RenderSubmitErrorKind.WeeklyLimit, message };
    if (lower.includes("daily"))
      return { kind: RenderSubmitErrorKind.DailyLimit, message };
    return { kind: RenderSubmitErrorKind.Unknown, message };
  }

  if (status === HTTP_FORBIDDEN) {
    return { kind: RenderSubmitErrorKind.ModeNotAvailable, message };
  }

  if (status === HTTP_BAD_REQUEST) {
    if (lower.includes("subscription not active"))
      return { kind: RenderSubmitErrorKind.SubscriptionNotActive, message };
    if (lower.includes("not available for this model"))
      return { kind: RenderSubmitErrorKind.ModelNotAvailable, message };
    if (lower.includes("render count reached"))
      return { kind: RenderSubmitErrorKind.MaxRenderCount, message };
    if (lower.includes("frame range exceeded"))
      return { kind: RenderSubmitErrorKind.MaxFrameRange, message };
  }

  return { kind: RenderSubmitErrorKind.Unknown, message };
}
