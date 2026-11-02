import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

const renderSubmitError = vi.hoisted(() => ({
  handled: false
}));
vi.mock("@domains/renders/useHandleRenderSubmitError", () => ({
  useHandleRenderSubmitError: () => () => renderSubmitError.handled
}));

const toast = vi.hoisted(() => ({
  showErrorToast: vi.fn()
}));
vi.mock("@store/useToast", () => ({
  useToast: () => ({ showErrorToast: toast.showErrorToast })
}));

const FALLBACK_MESSAGE = "Something failed";

const rejection = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("rejected");
  error.response = { status, data } as AxiosResponse;
  return error;
};

describe("useReportScriptProjectFailure", () => {
  beforeEach(() => {
    renderSubmitError.handled = false;
    toast.showErrorToast.mockClear();
  });

  it("does not show its own toast when the shared render-submit handler already reported it", () => {
    renderSubmitError.handled = true;
    const { result } = renderHook(() => useReportScriptProjectFailure());

    result.current(new Error("mode not available"), FALLBACK_MESSAGE);

    expect(toast.showErrorToast).not.toHaveBeenCalled();
  });

  it("shows the backend's own validation message when the error is a 422, with no Retry", () => {
    const { result } = renderHook(() => useReportScriptProjectFailure());

    result.current(
      rejection(422, { message: "Shot tags are capped at 12 characters" }),
      FALLBACK_MESSAGE,
      () => undefined
    );

    expect(toast.showErrorToast).toHaveBeenCalledWith({
      message: "Shot tags are capped at 12 characters"
    });
  });

  it("shows the action's own message with the Retry it was given for any other failure", () => {
    const retry = vi.fn();
    const { result } = renderHook(() => useReportScriptProjectFailure());

    result.current(new Error("server down"), FALLBACK_MESSAGE, retry);

    expect(toast.showErrorToast).toHaveBeenCalledWith({
      message: FALLBACK_MESSAGE,
      onRetry: retry
    });
  });
});
