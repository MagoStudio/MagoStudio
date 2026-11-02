import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { ComfySettings } from "../../../desktop/shared/contracts";
import {
  PROVIDER_PREFERENCES_EVENT,
  STORAGE_KEY
} from "../../platform/providerPreferences";

import { useTextModelRoute } from "./useTextModelRoute";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const installBridge = (settings: Promise<ComfySettings>) => {
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: { account: { mode: "cloud" }, comfy: { get: () => settings } }
  });
};

afterEach(() => {
  Reflect.deleteProperty(window, "mago");
  window.localStorage.clear();
});

describe("useTextModelRoute (desktop)", () => {
  it("stays pending until the saved choice is read, instead of guessing cloud", async () => {
    let resolveSettings!: (settings: ComfySettings) => void;
    installBridge(
      new Promise((resolve) => {
        resolveSettings = resolve;
      })
    );

    const { result } = renderHook(() => useTextModelRoute(), { wrapper });
    expect(result.current.isRoutePending).toBe(true);
    expect(result.current.routeLabel).toBeUndefined();

    resolveSettings({
      endpoint: "http://127.0.0.1:8188",
      vlmBackend: "qwen3-vl-2b-gguf",
      scriptTextModel: "qwen38-27b-q5",
      textModelProvider: "local"
    });
    await waitFor(() => expect(result.current.isRoutePending).toBe(false));
    expect(result.current.route).toBe("local");
    expect(result.current.routeLabel).toBe("(local)");
  });

  it("does not wait forever when there is no desktop bridge", () => {
    const { result } = renderHook(() => useTextModelRoute(), { wrapper });
    expect(result.current).toEqual({
      route: "cloud",
      routeLabel: "(cloud)",
      isRoutePending: false
    });
  });

  it("ignores the retired cloud switch when choosing the text route", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "mago-cloud": false })
    );
    installBridge(
      Promise.resolve({
        endpoint: "http://127.0.0.1:8188",
        vlmBackend: "qwen3-vl-2b-gguf",
        scriptTextModel: "qwen38-27b-q5",
        textModelProvider: "cloud"
      })
    );

    const { result } = renderHook(() => useTextModelRoute(), { wrapper });
    await waitFor(() => expect(result.current.isRoutePending).toBe(false));
    expect(result.current.routeLabel).toBe("(cloud)");
  });

  it("keeps the selected cloud route when retired preferences change", async () => {
    installBridge(
      Promise.resolve({
        endpoint: "http://127.0.0.1:8188",
        vlmBackend: "qwen3-vl-2b-gguf",
        scriptTextModel: "qwen38-27b-q5",
        textModelProvider: "cloud"
      })
    );

    const { result } = renderHook(() => useTextModelRoute(), { wrapper });
    await waitFor(() => expect(result.current.routeLabel).toBe("(cloud)"));

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "mago-cloud": false })
    );
    window.dispatchEvent(new CustomEvent(PROVIDER_PREFERENCES_EVENT));

    await waitFor(() => expect(result.current.routeLabel).toBe("(cloud)"));
  });
});
