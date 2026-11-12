import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useShotVersionReview } from "./useShotVersionReview";

const identity = vi.hoisted(() => ({
  userId: undefined as string | undefined
}));
vi.mock("@platform/identity", () => ({
  useUser: () => ({
    user: identity.userId ? { id: identity.userId } : undefined
  })
}));

beforeEach(() => {
  window.localStorage.clear();
  identity.userId = "first";
});

describe("personal shot version reviews", () => {
  it("isolates accounts and projects while restoring the original user's review", () => {
    const hook = renderHook(
      ({ projectId }) => useShotVersionReview(projectId),
      {
        initialProps: { projectId: "shared" }
      }
    );
    act(() => {
      hook.result.current.markVersionsViewed(["take"]);
      hook.result.current.setVersionRating("take", 1);
    });
    identity.userId = "second";
    hook.rerender({ projectId: "shared" });
    expect(hook.result.current.viewedVersionIds.size).toBe(0);
    expect(hook.result.current.ratingsByAssetId).toEqual({});
    identity.userId = "first";
    hook.rerender({ projectId: "other" });
    expect(hook.result.current.viewedVersionIds.size).toBe(0);
    hook.rerender({ projectId: "shared" });
    expect(hook.result.current.viewedVersionIds.has("take")).toBe(true);
    expect(hook.result.current.ratingsByAssetId.take).toBe(1);
  });

  it("does not read or write reviews before identity resolves", () => {
    window.localStorage.setItem(
      "mago:script-project:shared:version-review",
      '{"viewed":["take"],"ratings":{"take":1}}'
    );
    identity.userId = undefined;
    const hook = renderHook(() => useShotVersionReview("shared"));
    expect(hook.result.current.viewedVersionIds.size).toBe(0);
    act(() => hook.result.current.markVersionsViewed(["new"]));
    expect(window.localStorage.length).toBe(1);
    identity.userId = "first";
    hook.rerender();
    expect(hook.result.current.viewedVersionIds.size).toBe(0);
  });
  it("skips the storage write when every version is already viewed", () => {
    const hook = renderHook(() => useShotVersionReview("shared"));
    act(() => hook.result.current.markVersionsViewed(["take"]));
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    act(() => hook.result.current.markVersionsViewed(["take"]));
    expect(setItem).not.toHaveBeenCalled();
    act(() => hook.result.current.markVersionsViewed(["take", "next"]));
    expect(setItem).toHaveBeenCalledOnce();
    setItem.mockRestore();
  });
  it("reports the saved review as not ready until the user has loaded", () => {
    identity.userId = undefined;
    const hook = renderHook(() => useShotVersionReview("shared"));
    expect(hook.result.current.isReviewStorageReady).toBe(false);
    identity.userId = "first";
    hook.rerender();
    expect(hook.result.current.isReviewStorageReady).toBe(true);
  });
});

it("migrates legacy Local reviews once and keeps them with the claiming account", () => {
  window.localStorage.setItem(
    "mago:script-project:shared:viewed-shot-versions",
    '["old"]'
  );
  window.localStorage.setItem(
    "mago:script-project:shared:shot-version-ratings",
    '{"old":-1}'
  );
  const hook = renderHook(() => useShotVersionReview("shared"));
  expect(hook.result.current.viewedVersionIds.has("old")).toBe(true);
  expect(hook.result.current.ratingsByAssetId.old).toBe(-1);
  identity.userId = "second";
  hook.rerender();
  expect(hook.result.current.viewedVersionIds.size).toBe(0);
  expect(hook.result.current.ratingsByAssetId).toEqual({});
});
