import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDraftValue } from "./useDraftValue";

describe("useDraftValue", () => {
  it("becomes dirty once edited", () => {
    const { result } = renderHook(() => useDraftValue("first draft"));

    act(() => result.current.setDraftValue("edited"));

    expect(result.current.draftValue).toBe("edited");
    expect(result.current.isDraftDirty).toBe(true);
  });

  it("keeps the edit while the saved value is unchanged across renders", () => {
    const { result, rerender } = renderHook(
      ({ saved }) => useDraftValue(saved),
      { initialProps: { saved: "first draft" } }
    );

    act(() => result.current.setDraftValue("edited"));
    rerender({ saved: "first draft" });

    expect(result.current.draftValue).toBe("edited");
  });

  it("re-seeds when the saved value changes, so a re-cast is not overwritten", () => {
    const { result, rerender } = renderHook(
      ({ saved }) => useDraftValue(saved),
      { initialProps: { saved: "first draft" } }
    );

    act(() => result.current.setDraftValue("edited"));
    rerender({ saved: "rewritten by a re-cast" });

    expect(result.current.draftValue).toBe("rewritten by a re-cast");
    expect(result.current.isDraftDirty).toBe(false);
  });
});
