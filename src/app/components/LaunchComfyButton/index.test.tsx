import { QueryClient } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { LaunchComfyButton } from "./index";

const check = vi.fn(),
  launch = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(window, { mago: { comfy: { check, launch } } });
});
const renderButton = () =>
  renderWithProviders(<LaunchComfyButton />, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    })
  });

describe("Launch ComfyUI button", () => {
  it("stays hidden without a known launchable installation", async () => {
    check.mockResolvedValue({ available: false, canLaunch: false });
    const screen = renderButton();
    await waitFor(() => expect(check).toHaveBeenCalled());
    expect(screen.queryByTestId("launch-comfyui")).toBeNull();
    expect(launch).not.toHaveBeenCalled();
  });
  it("is hidden when ComfyUI is running", async () => {
    check.mockResolvedValue({ available: true });
    const screen = renderButton();
    await waitFor(() =>
      expect(screen.queryByTestId("launch-comfyui")).toBeNull()
    );
    expect(launch).not.toHaveBeenCalled();
  });

  it("launches when offline and disappears once ComfyUI responds", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    launch.mockImplementation(async () => {
      check.mockResolvedValue({ available: true });
    });
    const screen = renderButton();
    const button = await screen.findByTestId("launch-comfyui");
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByTestId("launch-comfyui")).toBeNull()
    );
  });

  it("shows progress while waiting for ComfyUI to start", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    launch.mockResolvedValue(undefined);
    const screen = renderButton();
    const button = await screen.findByTestId("launch-comfyui");
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(
      await screen.findByText(/This usually takes under a minute/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Checked 1 time · next check in \d+s$/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Starting ComfyUI" })
    ).toBeInTheDocument();
  });

  it("shows launch errors and keeps retry available", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    launch.mockRejectedValue(new Error("Launcher not found"));
    const screen = renderButton();
    const button = await screen.findByTestId("launch-comfyui");
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(await screen.findByText("Launcher not found")).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});
