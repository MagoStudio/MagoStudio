import { INSUFFICIENT_BALANCE_RENDER_MESSAGE } from "@domains/renders/utils/insufficientBalanceRenderMessage";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import {
  parseRenderSubmitError,
  RenderSubmitErrorKind
} from "./parseRenderSubmitError";

const axiosError = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("request failed");
  error.response = {
    status,
    statusText: "",
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() }
  };
  return error;
};

describe("parseRenderSubmitError", () => {
  it("classifies 429 daily limit", () => {
    expect(
      parseRenderSubmitError(
        axiosError(429, { detail: "relaxed_daily_limit_exceeded" })
      ).kind
    ).toBe(RenderSubmitErrorKind.DailyLimit);
  });

  it("classifies 429 weekly limit", () => {
    expect(
      parseRenderSubmitError(
        axiosError(429, { error: "relaxed_weekly_limit_exceeded" })
      ).kind
    ).toBe(RenderSubmitErrorKind.WeeklyLimit);
  });

  it("classifies 403 mode not available", () => {
    expect(
      parseRenderSubmitError(
        axiosError(403, { detail: "Unlimited mode not available on this plan" })
      ).kind
    ).toBe(RenderSubmitErrorKind.ModeNotAvailable);
  });

  it("classifies 400 subscription not active", () => {
    expect(
      parseRenderSubmitError(
        axiosError(400, { detail: "Subscription not active" })
      ).kind
    ).toBe(RenderSubmitErrorKind.SubscriptionNotActive);
  });

  it("classifies 400 model not available", () => {
    expect(
      parseRenderSubmitError(
        axiosError(400, {
          detail: "Unlimited mode is not available for this model"
        })
      ).kind
    ).toBe(RenderSubmitErrorKind.ModelNotAvailable);
  });

  it("classifies 400 max render count", () => {
    expect(
      parseRenderSubmitError(
        axiosError(400, { detail: "Max video render count reached" })
      ).kind
    ).toBe(RenderSubmitErrorKind.MaxRenderCount);
  });

  it("classifies 400 max frame range", () => {
    expect(
      parseRenderSubmitError(
        axiosError(400, { detail: "Maximum frame range exceeded" })
      ).kind
    ).toBe(RenderSubmitErrorKind.MaxFrameRange);
  });

  it("classifies 402 as an insufficient balance with an explicit message", () => {
    expect(
      parseRenderSubmitError(
        axiosError(402, { message: "Insufficient balance" })
      )
    ).toEqual({
      kind: RenderSubmitErrorKind.InsufficientBalance,
      message: INSUFFICIENT_BALANCE_RENDER_MESSAGE
    });
  });

  it("classifies a refusal prod sends in the message field", () => {
    expect(
      parseRenderSubmitError(
        axiosError(400, { message: "Max video render count reached" })
      ).kind
    ).toBe(RenderSubmitErrorKind.MaxRenderCount);
  });

  it("returns Unknown for unrelated errors", () => {
    expect(parseRenderSubmitError(axiosError(500, {})).kind).toBe(
      RenderSubmitErrorKind.Unknown
    );
    expect(parseRenderSubmitError(new Error("boom")).kind).toBe(
      RenderSubmitErrorKind.Unknown
    );
  });
});
