import { QueryClient } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { LocalSetupDownloadStep } from "./LocalSetupDownloadStep";

const checkComfy = vi.fn(),
  launchComfy = vi.fn(),
  onFinish = vi.fn();

const comfyStoppedWithKnownLauncher = {
  available: false,
  canLaunch: true,
  launchPath: "C:/MagoStudio/run_nvidia_gpu.bat"
};

const renderFinishedInstall = () =>
  renderWithProviders(
    <LocalSetupDownloadStep
      status={{
        phase: "done",
        files: [],
        directory: "C:/MagoStudio",
        error: null
      }}
      error={null}
      onPause={vi.fn()}
      onResume={vi.fn()}
      onCancel={vi.fn()}
      onExplore={vi.fn()}
      onFinish={onFinish}
    />,
    {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } }
      })
    }
  );

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(window, {
    mago: { comfy: { check: checkComfy, launch: launchComfy } }
  });
});

describe("finishing setup after the install is done", () => {
  it("offers only Launch ComfyUI while ComfyUI can still be launched", async () => {
    checkComfy.mockResolvedValue(comfyStoppedWithKnownLauncher);
    const screen = renderFinishedInstall();

    expect(await screen.findByTestId("launch-comfyui")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();
  });

  it("offers Finish once ComfyUI is running", async () => {
    checkComfy.mockResolvedValue({ available: true, canLaunch: true });
    const screen = renderFinishedInstall();

    fireEvent.click(await screen.findByRole("button", { name: "Finish" }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("launch-comfyui")).toBeNull();
  });

  it("offers Finish when the launch fails", async () => {
    checkComfy.mockResolvedValue(comfyStoppedWithKnownLauncher);
    launchComfy.mockRejectedValue(new Error("ComfyUI exited"));
    const screen = renderFinishedInstall();

    fireEvent.click(await screen.findByTestId("launch-comfyui"));
    expect(
      await screen.findByRole("button", { name: "Finish" })
    ).toBeInTheDocument();
  });

  it("offers Finish when Mago has no launcher for ComfyUI", async () => {
    checkComfy.mockResolvedValue({ available: false, canLaunch: false });
    const screen = renderFinishedInstall();

    expect(
      await screen.findByRole("button", { name: "Finish" })
    ).toBeInTheDocument();
  });

  it("offers Finish when the ComfyUI status cannot be read", async () => {
    checkComfy.mockRejectedValue(new Error("status unavailable"));
    const screen = renderFinishedInstall();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument()
    );
  });
});
