import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import type { ScriptSetupRequirement } from "../../../../desktop/shared/contracts";

import { LocalSetupDownloadAllMissingButton } from "./LocalSetupDownloadAllMissingButton";

const downloadRequirements = vi.fn();
const pauseDownload = vi.fn();

const lora = (
  name: string,
  status: ScriptSetupRequirement["status"]
): ScriptSetupRequirement => ({
  name,
  status,
  url: `https://huggingface.co/loras/resolve/main/${name}`,
  downloadUrl: `https://huggingface.co/loras/resolve/main/${name}`,
  installKind: "model",
  folder: "models/loras"
});

beforeEach(() => {
  vi.resetAllMocks();
  downloadRequirements.mockResolvedValue("C:/ComfyUI/models/loras");
  Object.assign(window, {
    mago: { localSetup: { downloadRequirements, pauseDownload } }
  });
});

describe("LocalSetupDownloadAllMissingButton", () => {
  it("downloads only the missing files in one click", async () => {
    const screen = renderWithProviders(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[
          lora("head_swap.safetensors", "missing"),
          lora("style_transfer.safetensors", "installed"),
          lora("character_swap.safetensors", "unknown")
        ]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download all missing (2)" })
    );

    await waitFor(() =>
      expect(downloadRequirements).toHaveBeenCalledWith("vfx-loras", [
        "head_swap.safetensors",
        "character_swap.safetensors"
      ])
    );
    expect(
      await screen.findByText(
        "Saved to C:/ComfyUI/models/loras. Check setup again after ComfyUI refreshes its model list."
      )
    ).toBeInTheDocument();
  });

  it("hides itself once every file is installed", () => {
    const screen = renderWithProviders(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[lora("head_swap.safetensors", "installed")]}
      />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stays mounted with its result after every file turns installed", async () => {
    const screen = renderWithProviders(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[lora("head_swap.safetensors", "missing")]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download all missing (1)" })
    );
    screen.rerender(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[lora("head_swap.safetensors", "installed")]}
      />
    );

    expect(
      await screen.findByText(
        "Saved to C:/ComfyUI/models/loras. Check setup again after ComfyUI refreshes its model list."
      )
    ).toBeInTheDocument();
  });

  it("retries with the files still missing at the time of the click", async () => {
    downloadRequirements.mockRejectedValueOnce(new Error("Paused"));
    const screen = renderWithProviders(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[
          lora("head_swap.safetensors", "missing"),
          lora("style_transfer.safetensors", "missing")
        ]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download all missing (2)" })
    );
    await screen.findByText("Paused");
    screen.rerender(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[
          lora("head_swap.safetensors", "installed"),
          lora("style_transfer.safetensors", "missing")
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Resume / retry" }));

    await waitFor(() =>
      expect(downloadRequirements).toHaveBeenLastCalledWith("vfx-loras", [
        "style_transfer.safetensors"
      ])
    );
  });

  it("shows why a pause failed", async () => {
    downloadRequirements.mockReturnValue(new Promise(() => {}));
    pauseDownload.mockRejectedValue(new Error("Pause failed"));
    const screen = renderWithProviders(
      <LocalSetupDownloadAllMissingButton
        batchName="vfx-loras"
        debugMissing={false}
        items={[lora("head_swap.safetensors", "missing")]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download all missing (1)" })
    );
    fireEvent.click(await screen.findByRole("button", { name: "Pause" }));

    expect(await screen.findByText("Pause failed")).toBeInTheDocument();
    expect(pauseDownload).toHaveBeenCalledWith("vfx-loras");
  });
});
