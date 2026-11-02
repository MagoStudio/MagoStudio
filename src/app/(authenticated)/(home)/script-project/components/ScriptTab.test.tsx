import "@config/i18n";
import { comfyLaunchDialogOpenAtom } from "@store/atoms/comfyLaunchDialogOpenAtom";
import { localSetupWizardOpenAtom } from "@store/atoms/localSetupWizardOpenAtom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "@/platform/providerPreferences";

import { ScriptTab } from "./ScriptTab";

const mocks = vi.hoisted(() => ({
  postMessage: vi.fn(),
  cast: vi.fn(),
  reportFailure: vi.fn(),
  scriptOpen: true,
  chatOptions: {} as {
    onOtherError?: (
      error: unknown,
      request: { projectId: string; userInput: string }
    ) => void;
  },
  castOptions: {} as { onError?: (error: unknown, request: object) => void }
}));
vi.mock("@domains/scriptProject/useAgentScriptDraft", () => ({
  useAgentScriptDraft: () => ({
    agentScriptDraft: "My script",
    isScriptBoxOpen: mocks.scriptOpen,
    setAgentScriptDraft: vi.fn(),
    saveAgentScriptDraft: vi.fn(),
    applyAgentScript: vi.fn()
  })
}));
vi.mock("@domains/scriptProject/useProjectOutputSize", () => ({
  useProjectOutputSize: () => ({
    outputSize: [1920, 1080],
    setOutputSize: vi.fn(),
    isSavingOutputSize: false
  })
}));
vi.mock("@domains/scriptProject/useSheetRenderModel", () => ({
  useSheetRenderModel: () => ({
    isLocalProject: true,
    canUseCloudSheetModels: false
  })
}));
vi.mock("./ProjectOutputSizeControls", () => ({
  ProjectOutputSizeControls: () => null
}));
vi.mock("./SheetRenderModelDropdown", () => ({
  SheetRenderModelDropdown: () => null
}));
vi.mock("@domains/scriptProject/data/useGetScriptChatMessages", () => ({
  useGetScriptChatMessages: () => ({
    data: { messages: [], pending: false },
    isError: false,
    refetch: vi.fn()
  })
}));
vi.mock("@domains/scriptProject/data/usePostScriptChatMessage", () => ({
  usePostScriptChatMessage: (options: typeof mocks.chatOptions) => {
    mocks.chatOptions = options;
    return { mutate: mocks.postMessage, isPending: false };
  }
}));
vi.mock("@domains/scriptProject/data/useCastProjectScript", () => ({
  useCastProjectScript: (options: typeof mocks.castOptions) => {
    mocks.castOptions = options;
    return { mutate: mocks.cast, mutateAsync: vi.fn(), isPending: false };
  }
}));
vi.mock("@domains/scriptProject/useReportScriptProjectFailure", () => ({
  useReportScriptProjectFailure: () => mocks.reportFailure
}));
vi.mock("@domains/scriptProject/useSaveProjectSettingsPatch", () => ({
  useSaveProjectSettingsPatch: () => ({
    project: undefined,
    saveProjectSettingsPatch: vi.fn()
  })
}));

const installBridge = (ready = false, verdict = "ready") => {
  const bridge = {
    account: {
      mode: "offline",
      chooseMode: vi.fn().mockResolvedValue(undefined)
    },
    comfy: {
      get: vi.fn().mockResolvedValue({ textModelProvider: "local" }),
      save: vi.fn().mockResolvedValue({}),
      scriptSetupStatus: vi.fn().mockResolvedValue({
        optional: [
          {
            id: "script-text",
            title: "Qwen3.8 27B Q5",
            requirements: [{ status: ready ? "installed" : "missing" }]
          }
        ]
      })
    },
    localSetup: { probeHardware: vi.fn().mockResolvedValue({ verdict }) }
  };
  Object.defineProperty(window, "mago", { configurable: true, value: bridge });
  return bridge;
};
const renderTab = () => {
  const store = createStore();
  render(
    <Provider store={store}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ScriptTab
          projectId="project-1"
          isRunActive={false}
          isScriptSent={false}
          onRunStarted={vi.fn()}
        />
      </QueryClientProvider>
    </Provider>
  );
  return store;
};
const enterMessage = () => {
  const input = screen.getByTestId("script-chat-input");
  fireEvent.change(input, { target: { value: "A short film" } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("Script tab text setup modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.scriptOpen = true;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "mago-cloud": false, "local-comfy": true })
    );
    HTMLElement.prototype.scrollTo = vi.fn();
  });
  afterEach(() => {
    Reflect.deleteProperty(window, "mago");
    localStorage.clear();
  });

  it.each(["Enter", "send"])(
    "blocks chat via %s without clearing the draft",
    async (trigger) => {
      installBridge();
      renderTab();
      const input = screen.getByTestId("script-chat-input");
      fireEvent.change(input, { target: { value: "A short film" } });
      if (trigger === "Enter") fireEvent.keyDown(input, { key: "Enter" });
      else fireEvent.click(screen.getByTestId("script-chat-send"));
      await screen.findByTestId("script-agent-sign-in-dialog");
      expect(mocks.postMessage).not.toHaveBeenCalled();
      expect(input).toHaveValue("A short film");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() =>
        expect(
          screen.queryByTestId("script-agent-sign-in-dialog")
        ).not.toBeInTheDocument()
      );
      expect(input).toHaveValue("A short film");
    }
  );

  it("blocks casting without changing the script", async () => {
    installBridge();
    renderTab();
    fireEvent.click(screen.getByTestId("script-project-generate-from-script"));
    await screen.findByTestId("script-agent-sign-in-dialog");
    expect(mocks.cast).not.toHaveBeenCalled();
    expect(screen.getByTestId("script-project-agent-script")).toHaveValue(
      "My script"
    );
  });

  it("allows local chat and casting when Qwen is ready", async () => {
    installBridge(true);
    renderTab();
    enterMessage();
    await waitFor(() =>
      expect(mocks.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ userInput: "A short film" })
      )
    );
    expect(screen.getByTestId("script-chat-input")).toHaveValue("");
    fireEvent.click(screen.getByTestId("script-project-generate-from-script"));
    await waitFor(() =>
      expect(mocks.cast).toHaveBeenCalledWith(
        expect.objectContaining({ script: "My script" }),
        expect.anything()
      )
    );
    expect(
      screen.queryByTestId("script-agent-sign-in-dialog")
    ).not.toBeInTheDocument();
  });

  it("guards idea cards too", async () => {
    mocks.scriptOpen = false;
    installBridge();
    renderTab();
    // All suggestion cards submit through the same chat hook.
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons.at(-1)!);
    await screen.findByTestId("script-agent-sign-in-dialog");
    expect(mocks.postMessage).not.toHaveBeenCalled();
  });

  it("opens and expands the setup wizard on compatible hardware", async () => {
    installBridge();
    const store = renderTab();
    const expand = vi.fn();
    window.addEventListener("mago:open-local-setup", expand);
    enterMessage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Local setup wizard" })
    );
    expect(store.get(localSetupWizardOpenAtom)).toBe(true);
    expect(expand).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByTestId("script-agent-sign-in-dialog")
      ).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("script-chat-input")).toHaveValue("A short film");
    window.removeEventListener("mago:open-local-setup", expand);
  });

  it("offers to launch ComfyUI instead of setup when its launcher is known", async () => {
    const bridge = installBridge();
    Object.assign(bridge.comfy, {
      check: vi.fn().mockResolvedValue({ available: false, canLaunch: true })
    });
    const store = renderTab();
    enterMessage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Launch ComfyUI" })
    );
    expect(store.get(comfyLaunchDialogOpenAtom)).toBe(true);
    expect(store.get(localSetupWizardOpenAtom)).toBe(false);
    expect(
      screen.queryByRole("button", { name: "Local setup wizard" })
    ).not.toBeInTheDocument();
  });

  it("hides setup on incompatible hardware and offers cloud sign in", async () => {
    const bridge = installBridge(false, "blocked");
    renderTab();
    enterMessage();
    await screen.findByTestId("script-agent-sign-in-dialog");
    await waitFor(() =>
      expect(bridge.localSetup.probeHardware).toHaveBeenCalled()
    );
    expect(
      screen.queryByRole("button", { name: "Local setup wizard" })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in to Mago cloud" })
    );
    await waitFor(() =>
      expect(bridge.account.chooseMode).toHaveBeenCalledWith("cloud")
    );
  });

  it("offers cloud text to a signed-in user who selected an unavailable local text model", async () => {
    const bridge = installBridge();
    bridge.account.mode = "cloud";
    bridge.comfy.save.mockImplementation(async () => {
      bridge.comfy.get.mockResolvedValue({ textModelProvider: "cloud" });
      return {};
    });
    renderTab();
    enterMessage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Enable Mago cloud" })
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("script-agent-sign-in-dialog")
      ).not.toBeInTheDocument()
    );
    enterMessage();
    await waitFor(() => expect(mocks.postMessage).toHaveBeenCalledTimes(1));
  });

  it("rechecks access before retrying failed chat", async () => {
    installBridge();
    renderTab();
    const request = { projectId: "project-1", userInput: "A short film" };
    act(() => mocks.chatOptions.onOtherError?.(new Error("network"), request));
    const retry = mocks.reportFailure.mock.calls[0][2] as () => Promise<void>;
    await act(async () => {
      await retry();
    });
    await screen.findByTestId("script-agent-sign-in-dialog");
    expect(mocks.postMessage).not.toHaveBeenCalled();
    expect(screen.getByTestId("script-chat-input")).toHaveValue("A short film");
  });

  it("rechecks access before retrying failed casting", async () => {
    const bridge = installBridge(true);
    renderTab();
    fireEvent.click(screen.getByTestId("script-project-generate-from-script"));
    await waitFor(() => expect(mocks.cast).toHaveBeenCalledTimes(1));
    const request = mocks.cast.mock.calls[0][0];
    act(() => mocks.castOptions.onError?.(new Error("network"), request));
    bridge.comfy.scriptSetupStatus.mockRejectedValue(
      new Error("engine unavailable")
    );
    const retry = mocks.reportFailure.mock.calls[0][2] as () => Promise<void>;
    await act(async () => {
      await retry();
    });
    await screen.findByTestId("script-agent-sign-in-dialog");
    expect(mocks.cast).toHaveBeenCalledTimes(1);
  });
});
