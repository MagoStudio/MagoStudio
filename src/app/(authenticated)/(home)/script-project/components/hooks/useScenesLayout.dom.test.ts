import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useScenesLayout } from "./useScenesLayout";

describe("useScenesLayout", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens the Storyboard tab in List and the Scenes tab in Cards", () => {
    expect(
      renderHook(() => useScenesLayout("storyboard")).result.current
        .scenesLayout
    ).toBe("list");
    expect(
      renderHook(() => useScenesLayout("video")).result.current.scenesLayout
    ).toBe("cards");
  });

  it("keeps each tab's choice apart", () => {
    const storyboardLayout = renderHook(() => useScenesLayout("storyboard"));
    act(() => storyboardLayout.result.current.setScenesLayout("cards"));

    expect(
      renderHook(() => useScenesLayout("video")).result.current.scenesLayout
    ).toBe("cards");
    expect(
      renderHook(() => useScenesLayout("storyboard")).result.current
        .scenesLayout
    ).toBe("cards");

    const videoLayout = renderHook(() => useScenesLayout("video"));
    act(() => videoLayout.result.current.setScenesLayout("list"));

    expect(
      renderHook(() => useScenesLayout("storyboard")).result.current
        .scenesLayout
    ).toBe("cards");
  });
});
