import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { IsReferenceImageUploadingProvider } from "@context/IsReferenceImageUploading";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { t } from "@tests/utils/i18n";
import { I18nextProvider } from "react-i18next";
import { describe, expect, test, beforeEach } from "vitest";

import { CopyPasteSettings } from "./index";

const queryClient = getQueryClient();

const TestedComponent = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <IsReferenceImageUploadingProvider>
          <CopyPasteSettings />
        </IsReferenceImageUploadingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

describe("CopyPasteSettings", () => {
  describe("Copy Paste", () => {
    beforeEach(() => {
      queryClient.clear();
    });

    test("Copy settings shows success popover and copies to clipboard", async () => {
      const user = userEvent.setup();
      render(<TestedComponent />);

      const copyButton = screen.getByRole("button", { name: /copy settings/i });
      await user.click(copyButton);

      const copiedText = t("notifications.copied_to_clipboard.description");
      await waitFor(() => {
        expect(screen.getByText(copiedText)).toBeInTheDocument();
      });
      const clipboardData = await navigator.clipboard.readText();
      expect(JSON.parse(clipboardData)).toHaveProperty("mago_engine");
    });

    test("Paste working settings on same model", async () => {
      const user = userEvent.setup();
      render(<TestedComponent />);

      const copyButton = screen.getByRole("button", { name: /copy settings/i });
      await user.click(copyButton);

      const pasteText = i18n.t("actions.paste_settings.ariaLabel");
      const pasteButton = screen.getByRole("button", { name: pasteText });
      await user.click(pasteButton);

      await waitFor(() => {
        expect(screen.getByText("Pasted")).toBeInTheDocument();
      });
    });

    test("Paste invalid settings shows error popover", async () => {
      const user = userEvent.setup();
      render(<TestedComponent />);

      await navigator.clipboard.writeText("{ invalid json }");

      const pasteText = i18n.t("actions.paste_settings.ariaLabel");
      const pasteButton = screen.getByRole("button", { name: pasteText });
      await user.click(pasteButton);

      const pasteFailText = i18n.t(
        "notifications.failed_to_paste_settings.description"
      );
      await waitFor(() => {
        expect(screen.getByText(pasteFailText)).toBeInTheDocument();
      });
    });

    test("Pasting settings from another model changes the current model", async () => {
      const user = userEvent.setup();
      render(<TestedComponent />);

      const copyButton = screen.getByRole("button", { name: /copy settings/i });
      await user.click(copyButton);

      const originalClipboardData = await navigator.clipboard.readText();
      const originalSettings = JSON.parse(originalClipboardData);
      expect(originalSettings.mago_engine).toBe("minimax_h3_local");

      const differentModelSettings = {
        ...originalSettings,
        mago_engine: "v2.5.0"
      };
      await navigator.clipboard.writeText(
        JSON.stringify(differentModelSettings)
      );

      const pasteText = i18n.t("actions.paste_settings.ariaLabel");
      const pasteButton = screen.getByRole("button", { name: pasteText });
      await user.click(pasteButton);

      await waitFor(() => {
        expect(screen.getByText("Pasted")).toBeInTheDocument();
      });

      await user.click(copyButton);

      await waitFor(() => {
        expect(
          screen.getByText(t("notifications.copied_to_clipboard.description"))
        ).toBeInTheDocument();
      });

      const newClipboardData = await navigator.clipboard.readText();
      const newSettings = JSON.parse(newClipboardData);
      expect(newSettings.mago_engine).toBe("v2.5.0");
    });
  });
});
