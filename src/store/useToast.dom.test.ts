import { toastNotificationsAtom } from "@store/atoms/toastAtom";
import { act, renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { useToast } from "./useToast";

const renderUseToast = () => {
  const store = createStore();
  const { result } = renderHook(() => useToast(), {
    wrapper: ({ children }) => createElement(Provider, { store }, children)
  });
  return { result, readToasts: () => store.get(toastNotificationsAtom) };
};

describe("useToast showErrorToast", () => {
  it("shows a toast with no timer that stays until acted on", () => {
    const { result, readToasts } = renderUseToast();

    act(() => {
      result.current.showErrorToast({ message: "Could not save that shot." });
    });

    expect(readToasts()).toEqual([
      expect.objectContaining({
        message: "Could not save that shot.",
        showTimer: false,
        autoDismiss: false
      })
    ]);
  });

  it("puts Retry in the cancel slot, which fires only on a press, and Dismiss in the submit slot", () => {
    const onRetry = vi.fn();
    const { result, readToasts } = renderUseToast();

    act(() => {
      result.current.showErrorToast({ message: "Cast failed.", onRetry });
    });

    const [shownToast] = readToasts();
    expect(shownToast?.onCancel).toBe(onRetry);
    expect(shownToast?.onCancelText).toBe("actions.retry.label");
    expect(shownToast?.onSubmitText).toBe("actions.dismiss.label");
    expect(shownToast?.onSubmit).toBeUndefined();
  });

  it("offers Dismiss only when nothing can be retried", () => {
    const { result, readToasts } = renderUseToast();

    act(() => {
      result.current.showErrorToast({ message: "That run did not finish." });
    });

    const [shownToast] = readToasts();
    expect(shownToast?.onCancelText).toBeUndefined();
    expect(shownToast?.onCancel).toBeUndefined();
    expect(shownToast?.onSubmitText).toBe("actions.dismiss.label");
  });
});
