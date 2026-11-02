import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { LocalSetupComfyRestartPrompt } from "./LocalSetupComfyRestartPrompt";

const restartStatus = vi.fn();
const restart = vi.fn();
const check = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  restart.mockResolvedValue(undefined);
  check.mockResolvedValue({
    available: true,
    canLaunch: true,
    endpoint: "http://127.0.0.1:8188"
  });
  Object.assign(window, {
    mago: { comfy: { restartStatus, restart, check } }
  });
});

describe("LocalSetupComfyRestartPrompt", () => {
  it("restarts ComfyUI only when the user presses the button, then reports it so setup is checked again", async () => {
    restartStatus.mockResolvedValue({
      restartMethod: "mago-launched-process",
      runningOrQueuedRenderCount: 0
    });
    const onRestarted = vi.fn();
    const screen = renderWithProviders(
      <LocalSetupComfyRestartPrompt onRestarted={onRestarted} />
    );

    const restartButton = await screen.findByRole("button", {
      name: "Restart ComfyUI"
    });
    expect(restart).not.toHaveBeenCalled();

    fireEvent.click(restartButton);

    await waitFor(() => expect(restart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onRestarted).toHaveBeenCalledTimes(1));
    expect(check).toHaveBeenCalled();
  });

  it("warns that running or queued renders stop when ComfyUI is busy", async () => {
    restartStatus.mockResolvedValue({
      restartMethod: "mago-launched-process",
      runningOrQueuedRenderCount: 2
    });
    const screen = renderWithProviders(<LocalSetupComfyRestartPrompt />);

    expect(
      await screen.findByText(
        "ComfyUI has 2 renders running or queued. Restarting stops them."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restart ComfyUI anyway" })
    ).toBeInTheDocument();
  });

  it("asks the user to restart a ComfyUI that Mago cannot restart", async () => {
    restartStatus.mockResolvedValue({
      restartMethod: null,
      runningOrQueuedRenderCount: 0
    });
    const screen = renderWithProviders(<LocalSetupComfyRestartPrompt />);

    expect(
      await screen.findByText(/Mago can't restart this ComfyUI/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("does not claim Mago didn't start ComfyUI when it cannot read the restart status", async () => {
    restartStatus.mockRejectedValue(new Error("bridge unavailable"));
    const screen = renderWithProviders(<LocalSetupComfyRestartPrompt />);

    expect(
      await screen.findByText(/couldn't check whether it can restart it/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Mago can't restart this ComfyUI/)).toBeNull();
  });
});
