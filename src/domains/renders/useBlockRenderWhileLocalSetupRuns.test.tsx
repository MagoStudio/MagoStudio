import { localSetupBlockedDialogOpenAtom } from "@store/atoms/localSetupBlockedDialogOpenAtom";
import { localSetupInProgressAtom } from "@store/atoms/localSetupInProgressAtom";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { describe, expect, it } from "vitest";

import { useBlockRenderWhileLocalSetupRuns } from "./useBlockRenderWhileLocalSetupRuns";

describe("local setup render guard", () => {
  it("allows cloud renders during local setup, and still blocks local renders", () => {
    const store = createStore();
    store.set(localSetupInProgressAtom, true);
    const { result } = renderHook(() => useBlockRenderWhileLocalSetupRuns(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });
    act(() => {
      expect(result.current(false)).toBe(false);
    });
    expect(store.get(localSetupBlockedDialogOpenAtom)).toBe(false);
    act(() => {
      expect(result.current(true)).toBe(true);
    });
    expect(store.get(localSetupBlockedDialogOpenAtom)).toBe(true);
    act(() => {
      store.set(localSetupInProgressAtom, false);
    });
    act(() => {
      expect(result.current(true)).toBe(false);
    });
  });
});
