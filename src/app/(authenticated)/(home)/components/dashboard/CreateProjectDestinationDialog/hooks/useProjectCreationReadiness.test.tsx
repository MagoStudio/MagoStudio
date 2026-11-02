import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  availability: { local: true, cloud: false },
  status: undefined as
    | {
        isGetStartedInstall: boolean;
        groups: Array<{ groupId: string; state: string }>;
      }
    | undefined,
  hasProbeFailed: false
}));
vi.mock("@domains/project/useProjectCreationAvailability", () => ({
  useProjectCreationAvailability: () => ({ availability: state.availability })
}));
vi.mock(
  "@app/components/LocalSetupWizard/hooks/useLocalModelGroupsStatus",
  () => ({
    useLocalModelGroupsStatus: () => ({
      data: state.status,
      isError: state.hasProbeFailed
    })
  })
);

import { useProjectCreationReadiness } from "./useProjectCreationReadiness";

beforeEach(() => {
  state.availability = { local: true, cloud: false };
  state.status = undefined;
  state.hasProbeFailed = false;
});
describe("useProjectCreationReadiness", () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true]
  ])("local installed %s, cloud signed in %s", (isInstalled, isSignedIn) => {
    state.availability.cloud = isSignedIn;
    state.status = {
      isGetStartedInstall: true,
      groups: [
        {
          groupId: "minimal",
          state: isInstalled ? "installed" : "not-installed"
        }
      ]
    };
    const { result } = renderHook(() => useProjectCreationReadiness());
    expect(result.current).toEqual({
      isLocalProjectCreationReady: isInstalled,
      isCloudProjectCreationReady: isSignedIn
    });
  });
  it("keeps Local disabled while the installation probe is pending", () => {
    const { result } = renderHook(() => useProjectCreationReadiness());
    expect(result.current.isLocalProjectCreationReady).toBe(false);
  });
  it("keeps Local disabled when the probe fails even with stale installed data", () => {
    state.status = {
      isGetStartedInstall: true,
      groups: [{ groupId: "minimal", state: "installed" }]
    };
    state.hasProbeFailed = true;
    state.availability.cloud = true;
    const { result } = renderHook(() => useProjectCreationReadiness());
    expect(result.current).toEqual({
      isLocalProjectCreationReady: false,
      isCloudProjectCreationReady: true
    });
  });
  it("retains the existing external ComfyUI path after status is available", () => {
    state.status = { isGetStartedInstall: false, groups: [] };
    const { result } = renderHook(() => useProjectCreationReadiness());
    expect(result.current.isLocalProjectCreationReady).toBe(true);
  });
});
