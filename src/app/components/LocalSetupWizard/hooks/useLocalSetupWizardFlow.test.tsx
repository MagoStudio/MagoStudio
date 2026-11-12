import { LOCAL_SETUP_DEBUG_ENABLED_KEY } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalSetupWizardFlow } from "./useLocalSetupWizardFlow";

const report = {
  graphicsCardName: "NVIDIA",
  videoMemoryLabel: "24 GB",
  systemMemoryLabel: "64 GB",
  verdict: "ready"
};
const drives = [
  { id: "disk", name: "Disk", rootPath: "D:/", freeGigabytes: 500 }
];
let phase = "downloading";
const notInstalledModelGroupsStatus = {
  isGetStartedInstall: false,
  installRootFreeBytes: null,
  groups: [
    { groupId: "minimal", state: "not-installed", missingBytes: 1_000 },
    { groupId: "local-llm", state: "not-installed", missingBytes: 2_000 },
    { groupId: "qwen-image", state: "not-installed", missingBytes: 3_000 },
    { groupId: "flux-image", state: "not-installed", missingBytes: 4_000 }
  ]
};
const modelGroupsStatus = vi.fn();
const probeHardware = vi.fn(),
  chooseFolder = vi.fn(),
  startInstaller = vi.fn(),
  pauseInstaller = vi.fn(),
  acceptedModelLicenseRepos = vi.fn(),
  acceptModelLicenses = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();
  phase = "downloading";
  probeHardware.mockResolvedValue(report);
  modelGroupsStatus.mockResolvedValue(notInstalledModelGroupsStatus);
  startInstaller.mockResolvedValue({ phase });
  acceptedModelLicenseRepos.mockResolvedValue([
    "Comfy-Org/MiniMax-H3",
    "alibaba-pai/MiniMax-H3-Acc-LoRAs",
    "Alissonerdx/Minimax-H3-ComfyUI",
    "akatz-ai/MiniMax-H3-Character-Swap-LoRA"
  ]);
  acceptModelLicenses.mockResolvedValue(undefined);
  pauseInstaller.mockImplementation(async () => {
    phase = "paused";
  });
  Object.assign(window, {
    mago: {
      localSetup: {
        probeHardware,
        chooseFolder,
        startInstaller,
        pauseInstaller,
        acceptedModelLicenseRepos,
        acceptModelLicenses,
        listDrives: async () => drives,
        selectStorageFolder: async () => ({ freeGigabytes: 500 }),
        installerStatus: async () => ({ phase, files: [] }),
        modelGroupsStatus
      }
    }
  });
});
const setup = (
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
) => {
  return renderHook(() => useLocalSetupWizardFlow(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
  });
};

const continueToStorage = async (hook: ReturnType<typeof setup>) => {
  act(() => hook.result.current.continueToModels());
  await waitFor(() => expect(hook.result.current.modelGroups).toHaveLength(4));
  await act(async () => {
    await hook.result.current.continueFromModels();
  });
};

it("refreshes open model settings once on completion and invalidates closed diagnostics", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const key = ["local-model-settings", "http://localhost:8188", "minimax"];
  const debugKey = ["model-diagnostics", "http://localhost:8188"];
  client.setQueryData(key, "missing");
  client.setQueryData(debugKey, "old report");
  const inspect = vi.fn().mockResolvedValue("ready");
  const observer = new QueryObserver(client, {
    queryKey: key,
    queryFn: inspect,
    staleTime: Infinity
  });
  const unsubscribe = observer.subscribe(() => {});
  const hook = setup(client);
  try {
    await act(async () =>
      client.setQueryData(["starter-installer"], {
        phase: "downloading",
        files: []
      })
    );
    expect(inspect).not.toHaveBeenCalled();
    await act(async () =>
      client.setQueryData(["starter-installer"], { phase: "done", files: [] })
    );
    await waitFor(() => expect(client.getQueryData(key)).toBe("ready"));
    expect(client.getQueryState(debugKey)?.isInvalidated).toBe(true);
    expect(inspect).toHaveBeenCalledTimes(1);
    await act(async () => {
      client.setQueryData(["starter-installer"], { phase: "done", files: [] });
    });
    expect(inspect).toHaveBeenCalledTimes(1);
  } finally {
    hook.unmount();
    unsubscribe();
    client.clear();
  }
});

describe("setup back navigation", () => {
  it("returns through storage and hardware to the initial choices without repeating the hardware check", async () => {
    const hook = setup();
    expect(hook.result.current.canGoBack).toBe(false);
    act(() => hook.result.current.startHardwareCheck());
    await waitFor(() =>
      expect(hook.result.current.state).toMatchObject({
        step: "hardware",
        outcome: "ready"
      })
    );
    await continueToStorage(hook);
    await waitFor(() => expect(hook.result.current.storagePending).toBe(false));
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state.step).toBe("models");
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state).toMatchObject({
      step: "hardware",
      outcome: "ready"
    });
    expect(probeHardware).toHaveBeenCalledTimes(1);
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state.step).toBe("welcome");
  });

  it("keeps active installation on its download step, then restores the selected storage location after pausing", async () => {
    const hook = setup();
    await continueToStorage(hook);
    await waitFor(() => expect(hook.result.current.drives).toHaveLength(1));
    await waitFor(() => expect(hook.result.current.storagePending).toBe(false));
    await act(async () => {
      await hook.result.current.startDownload();
    });
    await waitFor(() =>
      expect(hook.result.current.installer?.phase).toBe("downloading")
    );
    expect(hook.result.current.canGoBack).toBe(false);
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state.step).toBe("download");
    act(() => hook.result.current.pauseDownload());
    await waitFor(() => expect(hook.result.current.canGoBack).toBe(true));
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state).toMatchObject({
      step: "storage",
      selectedDriveId: "disk"
    });
    expect(startInstaller).toHaveBeenCalledTimes(1);
    expect(pauseInstaller).toHaveBeenCalledTimes(1);
  });

  it("does not jump back into storage when an old folder choice finishes after navigating away", async () => {
    let finish!: (choice: {
      folderPath: string;
      freeGigabytes: number;
    }) => void;
    chooseFolder.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const hook = setup();
    await continueToStorage(hook);
    act(() => hook.result.current.chooseInstallFolder());
    act(() => hook.result.current.goBack());
    await act(async () =>
      finish({ folderPath: "E:/Models", freeGigabytes: 500 })
    );
    expect(hook.result.current.state.step).toBe("models");
  });

  it("skips from storage to a fake download of the planned files without touching the installer", async () => {
    window.localStorage.setItem(LOCAL_SETUP_DEBUG_ENABLED_KEY, "true");
    phase = "idle";
    const hook = setup();
    await continueToStorage(hook);
    await waitFor(() => expect(hook.result.current.drives).toHaveLength(1));
    act(() => hook.result.current.skipToNextStep());
    expect(hook.result.current.state.step).toBe("download");
    await waitFor(() =>
      expect(hook.result.current.installer?.files.length).toBeGreaterThan(0)
    );
    expect(hook.result.current.installer?.phase).toBe("downloading");
    expect(hook.result.current.canGoBack).toBe(false);
    act(() => hook.result.current.pauseDownload());
    expect(hook.result.current.installer?.phase).toBe("paused");
    expect(hook.result.current.canGoBack).toBe(true);
    expect(startInstaller).not.toHaveBeenCalled();
    expect(pauseInstaller).not.toHaveBeenCalled();
    act(() => hook.result.current.goBack());
    expect(hook.result.current.state).toMatchObject({
      step: "storage",
      selectedDriveId: "disk"
    });
  });
});

const continueFromStorage = async (hook: ReturnType<typeof setup>) => {
  await continueToStorage(hook);
  await waitFor(() => expect(hook.result.current.drives).toHaveLength(1));
  await waitFor(() => expect(hook.result.current.storagePending).toBe(false));
  await act(async () => {
    await hook.result.current.startDownload();
  });
};

describe("fake download", () => {
  it("cannot start while the setup wizard debug tools are off", async () => {
    phase = "idle";
    const hook = setup();
    await continueToStorage(hook);
    await waitFor(() => expect(hook.result.current.drives).toHaveLength(1));

    act(() => hook.result.current.skipToNextStep());

    expect(hook.result.current.state.step).toBe("storage");
    expect(startInstaller).not.toHaveBeenCalled();
  });

  it("is what the skip starts only on the steps right before the download", async () => {
    window.localStorage.setItem(LOCAL_SETUP_DEBUG_ENABLED_KEY, "true");
    const hook = setup();
    expect(hook.result.current.doesSkipStartFakeDownload).toBe(false);

    act(() => hook.result.current.skipToNextStep());
    expect(hook.result.current.state.step).toBe("hardware");
    expect(hook.result.current.doesSkipStartFakeDownload).toBe(false);

    act(() => hook.result.current.skipToNextStep());
    expect(hook.result.current.state.step).toBe("models");
    expect(hook.result.current.doesSkipStartFakeDownload).toBe(false);

    act(() => hook.result.current.skipToNextStep());
    expect(hook.result.current.state.step).toBe("storage");
    expect(hook.result.current.doesSkipStartFakeDownload).toBe(true);
  });

  it("starts from the licenses step without accepting licenses or touching the installer", async () => {
    window.localStorage.setItem(LOCAL_SETUP_DEBUG_ENABLED_KEY, "true");
    acceptedModelLicenseRepos.mockResolvedValue([]);
    phase = "idle";
    const hook = setup();
    await continueFromStorage(hook);
    expect(hook.result.current.state.step).toBe("licenses");
    expect(hook.result.current.doesSkipStartFakeDownload).toBe(true);

    act(() => hook.result.current.skipToNextStep());

    expect(hook.result.current.state.step).toBe("download");
    await waitFor(() =>
      expect(hook.result.current.installer?.files.length).toBeGreaterThan(0)
    );
    expect(acceptModelLicenses).not.toHaveBeenCalled();
    expect(startInstaller).not.toHaveBeenCalled();
  });

  it("only runs after the team-test skip, so a real install reporting idle with no files stays on the real installer", async () => {
    phase = "idle";
    const hook = setup();
    await continueFromStorage(hook);

    expect(hook.result.current.state.step).toBe("download");
    expect(startInstaller).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(hook.result.current.installer?.phase).toBe("idle")
    );
    expect(hook.result.current.installer?.files).toEqual([]);

    act(() => hook.result.current.pauseDownload());
    await waitFor(() => expect(pauseInstaller).toHaveBeenCalledTimes(1));
  });
});

describe("model licenses step", () => {
  it("stops on the licenses step before downloading, listing every restrictive license, until the user accepts", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    const hook = setup();
    await continueFromStorage(hook);

    expect(hook.result.current.state).toMatchObject({
      step: "licenses",
      licensesAwaitingAcceptance: [
        { huggingFaceRepo: "Comfy-Org/MiniMax-H3" },
        { huggingFaceRepo: "alibaba-pai/MiniMax-H3-Acc-LoRAs" },
        { huggingFaceRepo: "Alissonerdx/Minimax-H3-ComfyUI" },
        { huggingFaceRepo: "akatz-ai/MiniMax-H3-Character-Swap-LoRA" }
      ]
    });
    expect(startInstaller).not.toHaveBeenCalled();

    await act(async () => {
      await hook.result.current.acceptModelLicensesAndStartDownload();
    });

    expect(acceptModelLicenses).toHaveBeenCalledWith([
      "Comfy-Org/MiniMax-H3",
      "alibaba-pai/MiniMax-H3-Acc-LoRAs",
      "Alissonerdx/Minimax-H3-ComfyUI",
      "akatz-ai/MiniMax-H3-Character-Swap-LoRA"
    ]);
    expect(startInstaller).toHaveBeenCalledTimes(1);
    expect(hook.result.current.state.step).toBe("download");
  });

  it("goes straight to the download when every restrictive license was accepted before", async () => {
    const hook = setup();
    await continueFromStorage(hook);

    expect(hook.result.current.state.step).toBe("download");
    expect(acceptModelLicenses).not.toHaveBeenCalled();
  });

  it("asks again, listing only the new license, when a restrictive model was added since the last acceptance", async () => {
    acceptedModelLicenseRepos.mockResolvedValue(["Comfy-Org/MiniMax-H3"]);
    const hook = setup();
    await continueFromStorage(hook);

    expect(hook.result.current.state).toMatchObject({
      step: "licenses",
      licensesAwaitingAcceptance: [
        { huggingFaceRepo: "alibaba-pai/MiniMax-H3-Acc-LoRAs" },
        { huggingFaceRepo: "Alissonerdx/Minimax-H3-ComfyUI" },
        { huggingFaceRepo: "akatz-ai/MiniMax-H3-Character-Swap-LoRA" }
      ]
    });
  });

  it("returns from the licenses step to the selected storage location without accepting", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    const hook = setup();
    await continueFromStorage(hook);

    act(() => hook.result.current.goBack());

    expect(hook.result.current.state).toMatchObject({
      step: "storage",
      selectedDriveId: "disk"
    });
    expect(acceptModelLicenses).not.toHaveBeenCalled();
    expect(startInstaller).not.toHaveBeenCalled();
  });

  it("reports a failed start on the licenses step, not as a storage error, and lets the user accept again", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    startInstaller.mockRejectedValueOnce(new Error("Disk write failed"));
    const hook = setup();
    await continueFromStorage(hook);

    await act(async () => {
      await hook.result.current.acceptModelLicensesAndStartDownload();
    });

    expect(hook.result.current.state.step).toBe("licenses");
    expect(hook.result.current.licensesError).toBe("Disk write failed");
    expect(hook.result.current.storageError).toBeNull();
    expect(hook.result.current.licensesPending).toBe(false);

    await act(async () => {
      await hook.result.current.acceptModelLicensesAndStartDownload();
    });

    expect(hook.result.current.state.step).toBe("download");
    expect(hook.result.current.licensesError).toBeNull();
  });
});

describe("models step", () => {
  it("installs Minimal plus the groups the user checks", async () => {
    const hook = setup();
    act(() => hook.result.current.continueToModels());
    await waitFor(() =>
      expect(hook.result.current.modelGroups).toHaveLength(4)
    );
    act(() => hook.result.current.toggleModelGroup("qwen-image", true));
    await act(async () => {
      await hook.result.current.continueFromModels();
    });
    await waitFor(() => expect(hook.result.current.drives).toHaveLength(1));
    await waitFor(() => expect(hook.result.current.storagePending).toBe(false));
    await act(async () => {
      await hook.result.current.startDownload();
    });

    expect(startInstaller).toHaveBeenCalledWith({
      modelGroupIds: ["minimal", "qwen-image"]
    });
  });

  it("opens Update installation on the models step with installed groups locked and the missing one preselected", async () => {
    modelGroupsStatus.mockResolvedValue({
      isGetStartedInstall: true,
      installRootFreeBytes: 1_000_000,
      groups: [
        { groupId: "minimal", state: "installed", missingBytes: 0 },
        { groupId: "local-llm", state: "not-installed", missingBytes: 2_000 },
        { groupId: "qwen-image", state: "not-installed", missingBytes: 3_000 },
        { groupId: "flux-image", state: "partial", missingBytes: 4_000 }
      ]
    });
    const hook = setup();
    act(() => hook.result.current.startUpdateInstallation(["qwen-image"]));
    await waitFor(() =>
      expect(hook.result.current.modelGroups).toHaveLength(4)
    );

    expect(hook.result.current.canGoBack).toBe(false);
    expect(
      hook.result.current.modelGroups.map(
        ({ groupId, isChecked, isLocked }) => ({ groupId, isChecked, isLocked })
      )
    ).toEqual([
      { groupId: "minimal", isChecked: true, isLocked: true },
      { groupId: "local-llm", isChecked: false, isLocked: false },
      { groupId: "qwen-image", isChecked: true, isLocked: false },
      { groupId: "flux-image", isChecked: true, isLocked: false }
    ]);

    await act(async () => {
      await hook.result.current.continueFromModels();
    });

    expect(startInstaller).toHaveBeenCalledWith({
      modelGroupIds: ["minimal", "qwen-image", "flux-image"]
    });
    expect(hook.result.current.state.step).toBe("download");
  });

  it("stops on the models step when the install folder lacks room for the added groups", async () => {
    modelGroupsStatus.mockResolvedValue({
      isGetStartedInstall: true,
      installRootFreeBytes: 10,
      groups: [
        { groupId: "minimal", state: "installed", missingBytes: 0 },
        { groupId: "local-llm", state: "not-installed", missingBytes: 2_000 },
        { groupId: "qwen-image", state: "not-installed", missingBytes: 3_000 },
        { groupId: "flux-image", state: "not-installed", missingBytes: 4_000 }
      ]
    });
    const hook = setup();
    act(() => hook.result.current.startUpdateInstallation(["local-llm"]));
    await waitFor(() =>
      expect(hook.result.current.modelGroups).toHaveLength(4)
    );

    await act(async () => {
      await hook.result.current.continueFromModels();
    });

    expect(hook.result.current.state.step).toBe("models");
    expect(hook.result.current.modelsError).not.toBeNull();
    expect(startInstaller).not.toHaveBeenCalled();
  });
});
