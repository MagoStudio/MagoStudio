import "@config/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readProviderPreferences,
  STORAGE_KEY
} from "@/platform/providerPreferences";

import { useScriptTextAccess } from "./useScriptTextAccess";

const setupStatus = (ready: boolean, variant = "Q5") => ({
  ready: false, // Other render models are deliberately absent.
  optional: [
    {
      id: "script-text",
      title: `Qwen3.8 27B ${variant} — text generation (selected in Settings)`,
      requirements: [
        { name: "SimpleQwenVLggufV2", status: "installed" },
        {
          name: `Qwen-${variant}.gguf`,
          status: ready ? "installed" : "missing"
        }
      ]
    }
  ]
});
const installBridge = (
  signedIn = false,
  cloudTextSelected = false,
  ready = false
) => {
  const bridge = {
    account: {
      mode: signedIn ? "cloud" : "offline",
      chooseMode: vi.fn().mockResolvedValue(undefined)
    },
    comfy: {
      get: vi.fn().mockResolvedValue({
        textModelProvider: cloudTextSelected ? "cloud" : "local",
        scriptTextModel: "qwen38-27b-q5"
      }),
      save: vi.fn().mockResolvedValue({}),
      scriptSetupStatus: vi.fn().mockResolvedValue(setupStatus(ready))
    },
    localSetup: {
      probeHardware: vi.fn().mockResolvedValue({ verdict: "ready" })
    }
  };
  Object.defineProperty(window, "mago", { configurable: true, value: bridge });
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ "mago-cloud": cloudTextSelected, "local-comfy": true })
  );
  return bridge;
};
const renderAccess = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return renderHook(() => useScriptTextAccess(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
  });
};

describe("Script tab text access", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    Reflect.deleteProperty(window, "mago");
    localStorage.clear();
  });

  it.each([
    [false, false, false, false],
    [false, true, false, false],
    [true, false, false, false],
    [true, true, false, true],
    [false, false, true, true],
    [false, true, true, true],
    [true, false, true, true],
    [true, true, true, true]
  ])(
    "signed in %s, cloud text selected %s, local ready %s => allowed %s",
    async (signedIn, cloud, ready, allowed) => {
      const bridge = installBridge(signedIn, cloud, ready);
      const { result } = renderAccess();
      await act(async () =>
        expect(await result.current.ensureAccess()).toBe(allowed)
      );
      expect(result.current.isOpen).toBe(!allowed);
      if (signedIn && cloud)
        expect(bridge.comfy.scriptSetupStatus).not.toHaveBeenCalled();
    }
  );

  it("ignores the retired provider switch for a selected cloud text model", async () => {
    const bridge = installBridge(true, true, false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ "mago-cloud": false }));
    const { result } = renderAccess();
    await act(async () =>
      expect(await result.current.ensureAccess()).toBe(true)
    );
    expect(bridge.comfy.scriptSetupStatus).not.toHaveBeenCalled();
  });

  it("allows the web app without desktop probes", async () => {
    const { result } = renderAccess();
    await act(async () =>
      expect(await result.current.ensureAccess()).toBe(true)
    );
  });

  it.each(["Q3", "Q5"])(
    "accepts a ready configured %s model",
    async (variant) => {
      const bridge = installBridge();
      bridge.comfy.scriptSetupStatus.mockResolvedValue(
        setupStatus(true, variant)
      );
      const { result } = renderAccess();
      await act(async () =>
        expect(await result.current.ensureAccess()).toBe(true)
      );
    }
  );

  it.each(["ready", "limited", "blocked"])(
    "offers setup according to hardware verdict %s",
    async (verdict) => {
      const bridge = installBridge();
      bridge.localSetup.probeHardware.mockResolvedValue({ verdict });
      const { result } = renderAccess();
      await act(async () => {
        await result.current.ensureAccess();
      });
      await waitFor(() =>
        expect(bridge.localSetup.probeHardware).toHaveBeenCalled()
      );
      await waitFor(() =>
        expect(result.current.canSetUpLocally).toBe(verdict !== "blocked")
      );
    }
  );

  it("blocks on a failed setup probe and hides setup when hardware cannot be verified", async () => {
    const bridge = installBridge();
    bridge.comfy.scriptSetupStatus.mockRejectedValue(new Error("offline"));
    bridge.localSetup.probeHardware.mockRejectedValue(new Error("unknown"));
    const { result } = renderAccess();
    await act(async () =>
      expect(await result.current.ensureAccess()).toBe(false)
    );
    expect(result.current.isOpen).toBe(true);
    expect(result.current.canSetUpLocally).toBe(false);
  });

  it("rechecks readiness after setup or when a previously installed model disappears", async () => {
    const bridge = installBridge();
    const { result } = renderAccess();
    await act(async () => {
      await result.current.ensureAccess();
      result.current.close();
    });
    bridge.comfy.scriptSetupStatus.mockResolvedValue(setupStatus(true));
    await act(async () =>
      expect(await result.current.ensureAccess()).toBe(true)
    );
    bridge.comfy.scriptSetupStatus.mockResolvedValue(setupStatus(false));
    await act(async () =>
      expect(await result.current.ensureAccess()).toBe(false)
    );
  });

  it("ignores duplicate submissions while probing", async () => {
    const bridge = installBridge();
    let finish!: (value: ReturnType<typeof setupStatus>) => void;
    bridge.comfy.scriptSetupStatus.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { result } = renderAccess();
    await act(async () => {
      const first = result.current.ensureAccess();
      expect(await result.current.ensureAccess()).toBe(false);
      await vi.waitFor(() =>
        expect(bridge.comfy.scriptSetupStatus).toHaveBeenCalled()
      );
      finish(setupStatus(true));
      expect(await first).toBe(true);
    });
    expect(bridge.comfy.scriptSetupStatus).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    "cloud action enables cloud text and signs in only if needed (signed in %s)",
    async (signedIn) => {
      const bridge = installBridge(signedIn);
      const { result } = renderAccess();
      await act(async () => {
        await result.current.ensureAccess();
        await result.current.enableCloud();
      });
      expect(bridge.comfy.save).toHaveBeenCalledWith(
        expect.objectContaining({ textModelProvider: "cloud" })
      );
      if (signedIn) {
        expect(result.current.isOpen).toBe(false);
        expect(readProviderPreferences()["mago-cloud"]).toBe(true);
        expect(bridge.account.chooseMode).not.toHaveBeenCalled();
      } else expect(bridge.account.chooseMode).toHaveBeenCalledWith("cloud");
    }
  );

  it("keeps the modal open and displays cloud action errors", async () => {
    const bridge = installBridge();
    bridge.account.chooseMode.mockRejectedValue(new Error("Sign in failed"));
    const { result } = renderAccess();
    await act(async () => {
      await result.current.ensureAccess();
      await result.current.enableCloud();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.cloudError).toBe("Sign in failed");
    expect(result.current.isCloudPending).toBe(false);
  });
});
