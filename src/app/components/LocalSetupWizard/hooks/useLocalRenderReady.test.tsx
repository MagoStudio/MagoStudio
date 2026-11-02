import { VideoEngine } from "@models/video/types";
import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { useLocalShotsReady, useLocalVideoReady } from "./useLocalRenderReady";

const modelStatus = vi.fn();
const scriptSetupStatus = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(window, {
    mago: { comfy: { modelStatus, scriptSetupStatus } }
  });
});
const Video = () => (
  <div>
    {useLocalVideoReady(VideoEngine.minimax_h3_local, {}) ? "ready" : "setup"}
  </div>
);
const Shots = ({ steps, local = true }: { steps: number; local?: boolean }) => (
  <div>{useLocalShotsReady(local, steps) ? "ready" : "setup"}</div>
);
const render = (element: React.ReactElement) =>
  renderWithProviders(element, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  });
describe("local render readiness", () => {
  it("does not probe ComfyUI for a cloud video model", () => {
    const CloudVideo = () => (
      <div>
        {useLocalVideoReady(VideoEngine.seedance_2, {}) ? "ready" : "setup"}
      </div>
    );
    const screen = render(<CloudVideo />);
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(modelStatus).not.toHaveBeenCalled();
  });
  it("requires a successful model check before allowing V2V rendering", async () => {
    modelStatus.mockResolvedValue({ ready: true });
    const screen = render(<Video />);
    expect(screen.getByText("setup")).toBeInTheDocument();
    expect(await screen.findByText("ready")).toBeInTheDocument();
  });
  it("keeps setup available when ComfyUI is unreachable", async () => {
    modelStatus.mockRejectedValue(new Error("Offline"));
    const screen = render(<Video />);
    await waitFor(() => expect(modelStatus).toHaveBeenCalled());
    expect(screen.getByText("setup")).toBeInTheDocument();
  });
  it("allows Fast rendering without the optional Slow files", async () => {
    scriptSetupStatus.mockResolvedValue({
      ready: true,
      highQuality: [{ status: "missing" }]
    });
    const screen = render(<Shots steps={4} />);
    expect(await screen.findByText("ready")).toBeInTheDocument();
    screen.rerender(<Shots steps={8} />);
    expect(screen.getByText("setup")).toBeInTheDocument();
  });
  it("does not probe ComfyUI for cloud ScriptShot projects", () => {
    const screen = render(<Shots steps={8} local={false} />);
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(scriptSetupStatus).not.toHaveBeenCalled();
  });
});
