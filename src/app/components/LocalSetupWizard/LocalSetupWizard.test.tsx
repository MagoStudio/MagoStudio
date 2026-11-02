import { LOCAL_SETUP_DEBUG_ENABLED_KEY } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { useLocalSetupWizardFlow } from "./hooks/useLocalSetupWizardFlow";
import { LocalSetupWizard } from "./LocalSetupWizard";

const probeHardware = vi.fn(),
  onClose = vi.fn();
const Harness = () => {
  const flow = useLocalSetupWizardFlow();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <LocalSetupWizard
      flow={flow}
      onClose={onClose}
      onUseCloud={vi.fn()}
      onCollapse={vi.fn()}
      isExistingComfyDialogOpen={isOpen}
      onOpenExistingComfyDialog={() => setIsOpen(true)}
      onCloseExistingComfyDialog={() => setIsOpen(false)}
    />
  );
};
const renderHarness = () =>
  renderWithProviders(<Harness />, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  });
beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();
  probeHardware.mockResolvedValue({
    graphicsCardName: "NVIDIA",
    videoMemoryLabel: "24 GB",
    systemMemoryLabel: "64 GB",
    verdict: "ready"
  });
  Object.assign(window, {
    mago: {
      localSetup: { probeHardware },
      comfy: { get: async () => ({ endpoint: "http://127.0.0.1:8188" }) }
    }
  });
});
describe("changing setup choices", () => {
  it("closes existing ComfyUI setup with its cross and enters automated installation without closing the wizard", async () => {
    window.localStorage.setItem(LOCAL_SETUP_DEBUG_ENABLED_KEY, "true");
    const screen = renderHarness();
    fireEvent.click(
      screen.getByRole("button", { name: "I already have ComfyUI" })
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "I don't have ComfyUI installed" })
    );
    await waitFor(() => expect(probeHardware).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: "I already have ComfyUI" })
    ).toBeInTheDocument();
  });
});

describe("setup wizard debug tools", () => {
  it("offers no Back, no Next and no show-all-missing preview while the setting is off", async () => {
    const screen = renderHarness();

    expect(screen.queryByRole("button", { name: /^Next \(/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "I already have ComfyUI" })
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Debug: show all requirements as missing")
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(
      screen.getByRole("button", { name: "I don't have ComfyUI installed" })
    );
    await waitFor(() => expect(probeHardware).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Next \(/ })).toBeNull();
  });

  it("offers all three once the setting is on", async () => {
    window.localStorage.setItem(LOCAL_SETUP_DEBUG_ENABLED_KEY, "true");
    const screen = renderHarness();

    expect(
      screen.getByRole("button", { name: "Next (for team test)" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "I already have ComfyUI" })
    );
    expect(
      await screen.findByLabelText("Debug: show all requirements as missing")
    ).toBeInTheDocument();
  });
});
