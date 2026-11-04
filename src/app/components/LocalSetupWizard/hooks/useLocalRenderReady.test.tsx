import { VideoEngine } from "@models/video/types";
import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import {
  MINIMAX_H3_STEP_LORAS,
  type MiniMaxH3StepLoraSteps
} from "../../../../../desktop/shared/minimaxH3StepLoras";

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
const Shots = ({
  steps,
  local = true
}: {
  steps: MiniMaxH3StepLoraSteps;
  local?: boolean;
}) => <div>{useLocalShotsReady(local, steps) ? "ready" : "setup"}</div>;
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
  it("allows HD rendering once the required HD step LoRA is installed", async () => {
    scriptSetupStatus.mockResolvedValue({
      ready: true,
      models: [
        { name: MINIMAX_H3_STEP_LORAS[8].loraFile, status: "installed" }
      ],
      optionalStepLoras: []
    });
    const screen = render(<Shots steps={8} />);
    expect(await screen.findByText("ready")).toBeInTheDocument();
  });
  it.each([
    ["not listed", []],
    [
      "listed as missing",
      [{ name: MINIMAX_H3_STEP_LORAS[4].loraFile, status: "missing" }]
    ]
  ])(
    "blocks turbo rendering while its optional step LoRA is %s",
    async (_description, optionalStepLoras) => {
      scriptSetupStatus.mockResolvedValue({
        ready: true,
        models: [
          { name: MINIMAX_H3_STEP_LORAS[8].loraFile, status: "installed" }
        ],
        optionalStepLoras
      });
      const screen = render(<Shots steps={8} />);
      expect(await screen.findByText("ready")).toBeInTheDocument();
      screen.rerender(<Shots steps={4} />);
      expect(screen.getByText("setup")).toBeInTheDocument();
    }
  );
  it("allows turbo rendering once its optional step LoRA is installed", async () => {
    scriptSetupStatus.mockResolvedValue({
      ready: true,
      models: [
        { name: MINIMAX_H3_STEP_LORAS[8].loraFile, status: "installed" }
      ],
      optionalStepLoras: [
        { name: MINIMAX_H3_STEP_LORAS[4].loraFile, status: "installed" }
      ]
    });
    const screen = render(<Shots steps={4} />);
    expect(await screen.findByText("ready")).toBeInTheDocument();
  });
  it("does not probe ComfyUI for cloud ScriptShot projects", () => {
    const screen = render(<Shots steps={8} local={false} />);
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(scriptSetupStatus).not.toHaveBeenCalled();
  });
});
