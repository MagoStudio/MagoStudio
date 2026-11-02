import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLatestRef } from "./useLatestRef";

describe("useLatestRef", () => {
  it("holds the newest value after a re-render", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatestRef(value),
      { initialProps: { value: "first" } }
    );

    rerender({ value: "second" });

    expect(result.current.current).toBe("second");
  });

  it("keeps the same ref object across re-renders", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatestRef(value),
      { initialProps: { value: 1 } }
    );
    const firstRef = result.current;

    rerender({ value: 2 });

    expect(result.current).toBe(firstRef);
  });
});
