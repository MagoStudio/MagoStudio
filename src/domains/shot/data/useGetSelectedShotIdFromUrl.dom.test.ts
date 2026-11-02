import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useSetSelectedShotIdFromUrl } from "./useGetSelectedShotIdFromUrl";

const nav = vi.hoisted(() => ({
  pathname: "/project",
  params: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params
}));

describe("useSetSelectedShotIdFromUrl", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("composes from the live URL, not the stale useSearchParams() snapshot, so a concurrent write survives", () => {
    window.history.replaceState(
      null,
      "",
      "/project?projectId=X&selectedTrackIds=track-1"
    );
    nav.params = new URLSearchParams("projectId=X");

    const { result } = renderHook(() => useSetSelectedShotIdFromUrl());
    result.current("shot2");

    expect(window.location.search).toContain("selectedTrackIds=track-1");
    expect(window.location.search).toContain("timelineId=shot2");
  });

  test("deletes only its own key, preserving the rest, when called with undefined", () => {
    window.history.replaceState(
      null,
      "",
      "/project?projectId=X&timelineId=shot1&selectedTrackIds=track-1"
    );
    nav.params = new URLSearchParams(
      "projectId=X&timelineId=shot1&selectedTrackIds=track-1"
    );

    const { result } = renderHook(() => useSetSelectedShotIdFromUrl());
    result.current(undefined);

    expect(window.location.search).not.toContain("timelineId=");
    expect(window.location.search).toContain("selectedTrackIds=track-1");
    expect(window.location.search).toContain("projectId=X");
  });
});
