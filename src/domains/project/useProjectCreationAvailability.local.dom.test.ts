import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProjectCreationAvailability } from "./useProjectCreationAvailability.local";

describe("useProjectCreationAvailability (desktop)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("offers a local project even when ComfyUI is not set up", () => {
    const check = vi.fn().mockResolvedValue({ available: false });
    vi.stubGlobal("mago", { account: { mode: "local" }, comfy: { check } });

    const { result } = renderHook(() => useProjectCreationAvailability());

    expect(result.current.availability.local).toBe(true);
    expect(result.current.isChecking).toBe(false);
    expect(check).not.toHaveBeenCalled();
  });

  it("offers a local project even when the Comfy provider is switched off", () => {
    window.localStorage.setItem(
      "mago.providerPreferences",
      JSON.stringify({ "local-comfy": false })
    );
    vi.stubGlobal("mago", { account: { mode: "local" } });

    const { result } = renderHook(() => useProjectCreationAvailability());

    expect(result.current.availability.local).toBe(true);
  });
});
