import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useSetSelectedTrackIdsFromUrl } from "./useGetSelectedTrackIdsFromUrl";

const nav = vi.hoisted(() => ({
  pathname: "/project",
  params: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params
}));

describe("useSetSelectedTrackIdsFromUrl", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("composes from the live URL, not the stale useSearchParams() snapshot, so a concurrent write survives", () => {
    window.history.replaceState(
      null,
      "",
      "/project?projectId=X&timelineId=shot1"
    );
    nav.params = new URLSearchParams("projectId=X");

    const { result } = renderHook(() => useSetSelectedTrackIdsFromUrl());
    result.current(["track1"]);

    expect(window.location.search).toContain("timelineId=shot1");
    expect(window.location.search).toContain("selectedTrackIds=track1");
  });

  test("is a no-op for an empty selection", () => {
    window.history.replaceState(
      null,
      "",
      "/project?projectId=X&timelineId=shot1"
    );
    nav.params = new URLSearchParams("projectId=X&timelineId=shot1");

    const { result } = renderHook(() => useSetSelectedTrackIdsFromUrl());
    result.current([]);

    expect(window.location.search).toBe("?projectId=X&timelineId=shot1");
  });
});
