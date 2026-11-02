import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useScriptProjectRun } from "./useScriptProjectRun";

const planProgress = vi.hoisted(() => ({
  data: undefined as
    | {
        status: string;
        progress_pct: number;
        completed_steps: number;
        total_steps: number;
        error?: { message: string };
      }
    | undefined,
  isError: false
}));
vi.mock("@domains/plan/usePlanProgress", () => ({
  usePlanProgress: () => planProgress
}));

const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showErrorToast: vi.fn()
}));
vi.mock("@store/useToast", () => ({
  useToast: () => ({
    showToast: toast.showToast,
    showErrorToast: toast.showErrorToast
  })
}));

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const PROJECT_ID = "project-1";

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  </I18nextProvider>
);

describe("useScriptProjectRun", () => {
  beforeEach(() => {
    planProgress.data = undefined;
    planProgress.isError = false;
    toast.showErrorToast.mockClear();
    toast.showToast.mockClear();
    router.push.mockClear();
  });

  it("shows the not-enough-credits toast once per run, with no timer and Buy credits plus Dismiss", () => {
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, vi.fn()),
      { wrapper }
    );

    act(() => {
      result.current.startRun({
        planId: "plan-paused",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    planProgress.data = {
      status: "PAUSED",
      progress_pct: 25,
      completed_steps: 1,
      total_steps: 4,
      error: { message: "Insufficient balance" }
    };
    rerender();
    rerender();

    expect(toast.showToast).toHaveBeenCalledTimes(1);
    const shownToast = toast.showToast.mock.calls[0]![0];
    expect(shownToast).toMatchObject({
      showTimer: false,
      autoDismiss: false,
      onCancelText: i18n.t("actions.buy_credits.label"),
      onSubmitText: i18n.t("actions.dismiss.label")
    });
    expect(router.push).not.toHaveBeenCalled();

    shownToast.onCancel();
    expect(router.push).toHaveBeenCalledWith("/payment/?tab=credits");
  });

  it("stops counting a credits-paused run as busy, and toasts again if the same run pauses a second time", () => {
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, vi.fn()),
      { wrapper }
    );
    act(() => {
      result.current.startRun({
        planId: "plan-paused-twice",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    const pausedForCredits = {
      status: "PAUSED",
      progress_pct: 25,
      completed_steps: 1,
      total_steps: 4,
      error: { message: "Insufficient balance" }
    };

    planProgress.data = pausedForCredits;
    rerender();
    expect(result.current.isRunActive).toBe(false);

    planProgress.data = {
      status: "RUNNING",
      progress_pct: 50,
      completed_steps: 2,
      total_steps: 4
    };
    rerender();
    expect(result.current.isRunActive).toBe(true);

    planProgress.data = pausedForCredits;
    rerender();
    expect(toast.showToast).toHaveBeenCalledTimes(2);
  });

  it.each(["assets", "shots"])(
    "keeps the current tab when a %s run completes",
    (ownerTabId) => {
      const onRunAdvancesTab = vi.fn();
      const { result, rerender } = renderHook(
        () => useScriptProjectRun(PROJECT_ID, onRunAdvancesTab),
        { wrapper }
      );
      act(() => {
        result.current.startRun({ planId: "plan-1", ownerTabId });
      });
      planProgress.data = {
        status: "COMPLETED",
        progress_pct: 100,
        completed_steps: 3,
        total_steps: 3
      };
      rerender();
      expect(result.current.isRunActive).toBe(false);
      expect(onRunAdvancesTab).not.toHaveBeenCalled();
    }
  );

  it("advances the tab when the run completes", () => {
    const queryClient = getQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onRunAdvancesTab = vi.fn();
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, onRunAdvancesTab),
      { wrapper }
    );

    act(() => {
      result.current.startRun({
        planId: "plan-1",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    rerender();

    planProgress.data = {
      status: "COMPLETED",
      progress_pct: 100,
      completed_steps: 3,
      total_steps: 3
    };
    rerender();

    expect(onRunAdvancesTab).toHaveBeenCalledWith("assets");
    expect(toast.showErrorToast).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.project.byId(PROJECT_ID)
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projects.all
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.homepage.all
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectList.all
    });
    invalidateSpy.mockRestore();
  });

  it("reattaches a recovered run after the project page remounts", () => {
    planProgress.data = {
      status: "RUNNING",
      progress_pct: 33,
      completed_steps: 1,
      total_steps: 3
    };
    const recoveredRun = {
      planId: "plan-recovered",
      advanceToTabId: "assets",
      ownerTabId: "script"
    };

    const { result } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, vi.fn(), recoveredRun),
      { wrapper }
    );

    expect(result.current.isRunActive).toBe(true);
    expect(result.current.runOwnerTabId).toBe("script");
    expect(result.current.runProgressPercent).toBe(33);
  });

  it("does not advance the tab and reports the failure when the run fails", () => {
    const onRunAdvancesTab = vi.fn();
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, onRunAdvancesTab),
      { wrapper }
    );

    act(() => {
      result.current.startRun({
        planId: "plan-1",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    rerender();

    planProgress.data = {
      status: "FAILED",
      progress_pct: 40,
      completed_steps: 1,
      total_steps: 3
    };
    rerender();

    expect(onRunAdvancesTab).not.toHaveBeenCalled();
    expect(toast.showErrorToast).toHaveBeenCalledWith({
      message: expect.any(String)
    });
  });

  it("stops rendering and reports a resumable paused plan", () => {
    const onRunAdvancesTab = vi.fn();
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, onRunAdvancesTab),
      { wrapper }
    );

    act(() => {
      result.current.startRun({
        planId: "plan-1",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    rerender();

    planProgress.data = {
      status: "PAUSED",
      progress_pct: 33,
      completed_steps: 1,
      total_steps: 3
    };
    rerender();

    expect(result.current.isRunActive).toBe(false);
    expect(onRunAdvancesTab).not.toHaveBeenCalled();
    expect(toast.showErrorToast).toHaveBeenCalledWith({
      message: expect.any(String)
    });
  });

  it("does not advance the tab and reports the failure when the run is cancelled", () => {
    const onRunAdvancesTab = vi.fn();
    const { result, rerender } = renderHook(
      () => useScriptProjectRun(PROJECT_ID, onRunAdvancesTab),
      { wrapper }
    );

    act(() => {
      result.current.startRun({
        planId: "plan-1",
        advanceToTabId: "assets",
        ownerTabId: "script"
      });
    });
    rerender();

    planProgress.data = {
      status: "CANCELLED",
      progress_pct: 40,
      completed_steps: 1,
      total_steps: 3
    };
    rerender();

    expect(onRunAdvancesTab).not.toHaveBeenCalled();
    expect(toast.showErrorToast).toHaveBeenCalled();
  });
});
