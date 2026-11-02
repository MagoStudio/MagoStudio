import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useOnboardingStepTransition } from "./useOnboardingStepTransition";

afterEach(() => {
  vi.useRealTimers();
});

describe("useOnboardingStepTransition", () => {
  test("first mount renders a single entering layer (enter-only)", () => {
    const { result } = renderHook(
      ({ key, node }) => useOnboardingStepTransition(key, node),
      { initialProps: { key: "upload", node: "A" } }
    );

    expect(result.current).toEqual([
      { key: "upload", node: "A", role: "entering" }
    ]);
  });

  test("on a key change both layers co-exist (outgoing + incoming overlap)", () => {
    const { result, rerender } = renderHook(
      ({ key, node }) => useOnboardingStepTransition(key, node),
      { initialProps: { key: "upload", node: "A" } }
    );

    act(() => rerender({ key: "generate-image", node: "B" }));

    expect(result.current).toEqual([
      { key: "upload", node: "A", role: "exiting" },
      { key: "generate-image", node: "B", role: "entering" }
    ]);
  });

  test("the exiting layer is removed after the 300ms fade-out window", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ key, node }) => useOnboardingStepTransition(key, node),
      { initialProps: { key: "upload", node: "A" } }
    );

    act(() => rerender({ key: "generate-image", node: "B" }));
    expect(result.current).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toEqual([
      { key: "generate-image", node: "B", role: "entering" }
    ]);
  });

  test("a re-swap mid-transition keeps the latest screen as the exiting layer", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ key, node }) => useOnboardingStepTransition(key, node),
      { initialProps: { key: "upload", node: "A" } }
    );

    act(() => rerender({ key: "generate-image", node: "B" }));
    act(() => rerender({ key: "select-image", node: "C" }));

    expect(result.current).toEqual([
      { key: "generate-image", node: "B", role: "exiting" },
      { key: "select-image", node: "C", role: "entering" }
    ]);
  });
});
