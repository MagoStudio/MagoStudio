import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRedirectCap } from "./useRedirectCap";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace })
}));

afterEach(() => {
  vi.useRealTimers();
  replace.mockClear();
});

describe("useRedirectCap", () => {
  it("redirects to / once the 5s cap elapses while the decision is unresolved", () => {
    vi.useFakeTimers();
    renderHook(() => useRedirectCap());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does not redirect once navigation already happened and the page unmounted", () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useRedirectCap());

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(replace).not.toHaveBeenCalled();
  });
});
