import { i18n } from "@config/i18n";
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
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComfyLaunchDialog } from "./ComfyLaunchDialog";

const check = vi.fn(),
  launch = vi.fn();
const launchPath =
  "D:\\MagoStudio\\ComfyUI_windows_portable\\run_nvidia_gpu.bat";

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(window, { mago: { comfy: { check, launch } } });
  launch.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
});

const renderDialog = () => {
  const store = createStore();
  const onClose = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <ComfyLaunchDialog onClose={onClose} />
        </QueryClientProvider>
      </Provider>
    </I18nextProvider>
  );
  return { store, onClose };
};

describe("ComfyUI launch dialog", () => {
  it("launches ComfyUI and closes once it responds", async () => {
    check.mockResolvedValue({ available: true, canLaunch: true, launchPath });
    const { onClose } = renderDialog();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(launch).toHaveBeenCalledOnce();
  });

  it("shows progress while ComfyUI is starting", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true, launchPath });
    renderDialog();
    expect(
      await screen.findByText(/^Checked 1 time · next check in \d+s$/)
    ).toBeInTheDocument();
    expect(screen.getByText("Starting ComfyUI")).toBeInTheDocument();
    expect(screen.getByText(launchPath)).toBeInTheDocument();
  });

  it("offers the setup wizard after 5 minutes without a response", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    check.mockResolvedValue({ available: false, canLaunch: true, launchPath });
    const { store, onClose } = renderDialog();
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(screen.getByText("ComfyUI didn't start")).toBeInTheDocument();
    expect(
      screen.getByText(/didn't respond within 5 minutes/)
    ).toBeInTheDocument();
    const expandWizard = vi.fn();
    window.addEventListener("mago:open-local-setup", expandWizard);
    fireEvent.click(screen.getByRole("button", { name: "Setup Mago Studio" }));
    expect(store.get(localSetupWizardOpenAtom)).toBe(true);
    expect(expandWizard).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    window.removeEventListener("mago:open-local-setup", expandWizard);
  });

  it("shows the launcher error and retries on request", async () => {
    launch.mockRejectedValueOnce(new Error("ComfyUI launcher was not found."));
    check.mockResolvedValue({ available: true, canLaunch: true, launchPath });
    const { onClose } = renderDialog();
    expect(
      await screen.findByText("ComfyUI launcher was not found.")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(launch.mock.calls).toEqual([
      [{ restartUnresponsiveProcess: false }],
      [{ restartUnresponsiveProcess: true }]
    ]);
  });

  it("stops waiting and offers setup when the launched process exits", async () => {
    check.mockResolvedValue({
      available: false,
      canLaunch: true,
      launchPath,
      launchedProcess: {
        status: "exited",
        exitCode: 1,
        reportedFailureReason: "Found no NVIDIA driver on your system."
      }
    });
    renderDialog();
    expect(await screen.findByText("ComfyUI didn't start")).toBeInTheDocument();
    expect(
      screen.getByText(/closed while starting \(exit code 1\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "ComfyUI reported: Found no NVIDIA driver on your system."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Setup Mago Studio" })
    ).toBeInTheDocument();
  });

  it("keeps waiting when a status check fails", async () => {
    check
      .mockRejectedValueOnce(new Error("Error invoking remote method"))
      .mockResolvedValue({ available: false, canLaunch: true, launchPath });
    renderDialog();
    expect(await screen.findByText(/^Checked 1 time/)).toBeInTheDocument();
    expect(screen.queryByText("ComfyUI didn't start")).toBeNull();
  });

  it("stops checking when cancelled", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true, launchPath });
    const { onClose } = renderDialog();
    await screen.findByText(/^Checked 1 time/);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
