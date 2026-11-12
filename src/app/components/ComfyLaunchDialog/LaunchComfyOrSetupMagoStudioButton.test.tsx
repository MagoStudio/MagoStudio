import type { RequiredLocalInstall } from "@app/components/LocalSetupWizard/requiredLocalInstall";
import { i18n } from "@config/i18n";
import { comfyLaunchDialogOpenAtom } from "@store/atoms/comfyLaunchDialogOpenAtom";
import { localSetupWizardOpenAtom } from "@store/atoms/localSetupWizardOpenAtom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LaunchComfyOrSetupMagoStudioButton } from "./LaunchComfyOrSetupMagoStudioButton";

const check = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(window, { mago: { comfy: { check } } });
});

const renderButton = ({
  onSetup,
  lockedRenderButton,
  requiredLocalInstall
}: {
  onSetup?: () => void;
  lockedRenderButton?: React.ReactNode;
  requiredLocalInstall?: RequiredLocalInstall;
} = {}) => {
  const store = createStore();
  render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <LaunchComfyOrSetupMagoStudioButton
            onSetup={onSetup}
            requiredLocalInstall={requiredLocalInstall}
            lockedRenderButton={lockedRenderButton}
          />
        </QueryClientProvider>
      </Provider>
    </I18nextProvider>
  );
  return store;
};

describe("Launch ComfyUI or Setup Mago Studio button", () => {
  it("offers to launch ComfyUI when it is stopped and its launcher is known", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    const store = renderButton();
    fireEvent.click(
      await screen.findByRole("button", { name: "Launch ComfyUI" })
    );
    await waitFor(() =>
      expect(store.get(comfyLaunchDialogOpenAtom)).toBe(true)
    );
    expect(store.get(localSetupWizardOpenAtom)).toBe(false);
  });

  it("hides its tooltip while the launch dialog is open", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    renderButton();
    const launchComfyButton = await screen.findByRole("button", {
      name: "Launch ComfyUI"
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "ComfyUI isn't running. Launch it to render locally."
    );
    fireEvent.click(launchComfyButton);
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("opens the launch dialog only once its caller is ready", async () => {
    check.mockResolvedValue({ available: false, canLaunch: true });
    const onBeforeOpenComfyLaunch = vi.fn().mockResolvedValue(false);
    const store = createStore();
    render(
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <QueryClientProvider
            client={
              new QueryClient({ defaultOptions: { queries: { retry: false } } })
            }
          >
            <LaunchComfyOrSetupMagoStudioButton
              onBeforeOpenComfyLaunch={onBeforeOpenComfyLaunch}
            />
          </QueryClientProvider>
        </Provider>
      </I18nextProvider>
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Launch ComfyUI" })
    );
    await waitFor(() => expect(onBeforeOpenComfyLaunch).toHaveBeenCalledOnce());
    expect(store.get(comfyLaunchDialogOpenAtom)).toBe(false);
  });

  it("offers setup when the launcher is unknown", async () => {
    check.mockResolvedValue({ available: false, canLaunch: false });
    const onSetup = vi.fn();
    const store = renderButton({ onSetup });
    fireEvent.click(
      await screen.findByRole("button", { name: "Setup Mago Studio" })
    );
    expect(onSetup).toHaveBeenCalledOnce();
    expect(store.get(localSetupWizardOpenAtom)).toBe(true);
  });

  it("offers setup when ComfyUI runs but the render is still not ready", async () => {
    check.mockResolvedValue({ available: true, canLaunch: true });
    renderButton();
    expect(
      await screen.findByRole("button", { name: "Setup Mago Studio" })
    ).toBeInTheDocument();
  });

  it("offers setup until the launch status is known", async () => {
    check.mockReturnValue(new Promise(() => {}));
    renderButton();
    await waitFor(() => expect(check).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Setup Mago Studio" })
    ).toBeInTheDocument();
  });

  describe("with a locked render button", () => {
    const lockedGenerateButton = (
      <button type="button" disabled>
        Generate
      </button>
    );

    it("keeps the locked button and offers to launch ComfyUI in a warning popup", async () => {
      check.mockResolvedValue({ available: false, canLaunch: true });
      const store = renderButton({ lockedRenderButton: lockedGenerateButton });
      const launchComfyButton = await screen.findByRole("button", {
        name: "Launch ComfyUI"
      });
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "ComfyUI isn't running. Launch it to render locally."
      );
      expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
      fireEvent.click(launchComfyButton);
      await waitFor(() =>
        expect(store.get(comfyLaunchDialogOpenAtom)).toBe(true)
      );
      expect(screen.queryByRole("tooltip")).toBeNull();
      expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    });

    it("keeps the locked button and offers setup in a warning popup before setup is complete", async () => {
      check.mockResolvedValue({ available: false, canLaunch: false });
      const store = renderButton({ lockedRenderButton: lockedGenerateButton });
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "To render locally, you need to finish the setup."
      );
      expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
      fireEvent.click(
        screen.getByRole("button", { name: "Setup Mago Studio" })
      );
      expect(store.get(localSetupWizardOpenAtom)).toBe(true);
    });

    it("offers to update the installation in a warning popup once setup is complete", async () => {
      check.mockResolvedValue({ available: false, canLaunch: false });
      Object.assign(window, {
        mago: {
          comfy: { check },
          localSetup: {
            installerStatus: vi
              .fn()
              .mockResolvedValue({ hasCompletedInstall: true })
          }
        }
      });
      const store = renderButton({
        lockedRenderButton: lockedGenerateButton,
        requiredLocalInstall: { kind: "manual-download" }
      });
      const updateInstallationButton = await screen.findByRole("button", {
        name: "Update installation"
      });
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "This model isn't installed yet. Add it to your setup."
      );
      fireEvent.click(updateInstallationButton);
      await waitFor(() =>
        expect(store.get(localSetupWizardOpenAtom)).toBe(true)
      );
    });
  });
});
