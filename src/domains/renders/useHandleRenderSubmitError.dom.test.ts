import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useHandleRenderSubmitError } from "./useHandleRenderSubmitError";

const mocks = vi.hoisted(() => ({
  openNewUsersPaywall: vi.fn(),
  showToast: vi.fn(),
  subscription: {
    doesSubscriptionGrantAccess: false,
    isLoading: false,
    relaxedUsage: null
  }
}));

vi.mock("@domains/payment/useOpenNewUsersPaywall", () => ({
  useOpenNewUsersPaywall: () => mocks.openNewUsersPaywall
}));
vi.mock("@domains/payment/useCurrentSubscription", () => ({
  useCurrentSubscription: () => mocks.subscription
}));
vi.mock("@domains/payment/useIsUnlimitedModeActive", () => ({
  useIsUnlimitedModeActive: () => ({ setIsUnlimitedModeActive: vi.fn() })
}));
vi.mock("@store/useToast", () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));

const HTTP_PAYMENT_REQUIRED = 402;

const insufficientBalanceError = () =>
  new AxiosError("Payment Required", "ERR_BAD_REQUEST", undefined, undefined, {
    status: HTTP_PAYMENT_REQUIRED,
    statusText: "Payment Required",
    data: { message: "Insufficient balance" },
    headers: {},
    config: { headers: new AxiosHeaders() }
  });

const renderHandler = () => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(() => useHandleRenderSubmitError(), {
    wrapper
  });
  return { handleRenderSubmitError: result.current, invalidateQueries };
};

describe("useHandleRenderSubmitError for an insufficient balance", () => {
  beforeEach(() => {
    mocks.openNewUsersPaywall.mockClear();
    mocks.showToast.mockClear();
  });

  it("opens the paywall and refreshes the balance when the subscription lacks access", () => {
    mocks.subscription.doesSubscriptionGrantAccess = false;
    const { handleRenderSubmitError, invalidateQueries } = renderHandler();

    expect(handleRenderSubmitError(insufficientBalanceError())).toBe(true);

    expect(mocks.openNewUsersPaywall).toHaveBeenCalledOnce();
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.balance.all
    });
  });

  it("tells a subscriber to top up and refreshes the balance", () => {
    mocks.subscription.doesSubscriptionGrantAccess = true;
    const { handleRenderSubmitError, invalidateQueries } = renderHandler();

    expect(handleRenderSubmitError(insufficientBalanceError())).toBe(true);

    expect(mocks.openNewUsersPaywall).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: expect.stringContaining("enough credits")
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.balance.all
    });
  });
});
