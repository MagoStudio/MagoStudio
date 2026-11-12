import { i18n } from "@config/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequirementDownloadStatus } from "../../../../desktop/shared/contracts";

import { LocalSetupRequirementDownload } from "./LocalSetupRequirementDownload";

const GIB = 1_073_741_824;

const mountWithBackgroundDownload = (
  backgroundDownload: RequirementDownloadStatus | null
) => {
  const localSetup = {
    requirementDownloadStatus: vi.fn(async () => backgroundDownload),
    downloadRequirement: vi.fn(),
    pauseDownload: vi.fn(),
    cancelDownload: vi.fn(async () => {})
  };
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: { localSetup }
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LocalSetupRequirementDownload
        item={{
          name: "Qwen3.8-27B-UD-Q3_K_XL.gguf",
          url: "https://huggingface.co/example",
          downloadUrl: "https://huggingface.co/example/model.gguf",
          installKind: "model",
          status: "missing"
        }}
        startDownloadOnceLicensesAccepted={async (startDownload) =>
          startDownload()
        }
      />
    </QueryClientProvider>
  );
  return localSetup;
};
const buttonNamed = (key: string) =>
  screen.getByRole("button", { name: i18n.t(key) });

describe("LocalSetupRequirementDownload", () => {
  beforeEach(() => void i18n.changeLanguage("en"));

  it("shows the progress of a download that kept running while the row was closed", async () => {
    mountWithBackgroundDownload({
      phase: "downloading",
      downloadedBytes: 3 * GIB,
      totalBytes: 12 * GIB,
      error: null
    });
    expect(await screen.findByText("3.0 of 12.0 GB")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: i18n.t("localSetup.requirementDownload.pause")
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: i18n.t("localSetup.requirementDownload.download")
      })
    ).not.toBeInTheDocument();
  });

  it("offers to resume a download that was paused while the row was closed", async () => {
    mountWithBackgroundDownload({
      phase: "paused",
      downloadedBytes: 5 * GIB,
      totalBytes: 12 * GIB,
      error: "This operation was aborted"
    });
    expect(
      await screen.findByRole("button", {
        name: i18n.t("localSetup.requirementDownload.resume")
      })
    ).toBeInTheDocument();
    expect(screen.getByText("5.0 of 12.0 GB")).toBeInTheDocument();
  });

  it("offers a plain download when nothing was started", async () => {
    mountWithBackgroundDownload(null);
    expect(
      await screen.findByRole("button", {
        name: i18n.t("localSetup.requirementDownload.download")
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows the progress above Downloading, with Pause and Cancel beside it", async () => {
    mountWithBackgroundDownload({
      phase: "downloading",
      downloadedBytes: 3 * GIB,
      totalBytes: 12 * GIB,
      error: null
    });
    await screen.findByText("3.0 of 12.0 GB");
    const downloadingButton = buttonNamed(
      "localSetup.requirementDownload.downloading"
    );
    expect(downloadingButton.parentElement).toBe(
      buttonNamed("localSetup.requirementDownload.pause").parentElement
    );
    expect(downloadingButton.parentElement).toBe(
      buttonNamed("localSetup.requirementDownload.cancel").parentElement
    );
    expect(
      screen
        .getByText("3.0 of 12.0 GB")
        .compareDocumentPosition(downloadingButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("asks before cancelling and deletes the download only on Delete", async () => {
    const user = userEvent.setup();
    const localSetup = mountWithBackgroundDownload({
      phase: "downloading",
      downloadedBytes: 3 * GIB,
      totalBytes: 12 * GIB,
      error: null
    });
    await screen.findByText("3.0 of 12.0 GB");
    await user.click(buttonNamed("localSetup.requirementDownload.cancel"));
    expect(
      await screen.findByText(
        i18n.t("localSetup.requirementDownload.cancelDialog.title")
      )
    ).toBeInTheDocument();
    await user.click(
      buttonNamed("localSetup.requirementDownload.cancelDialog.back")
    );
    expect(localSetup.cancelDownload).not.toHaveBeenCalled();
    await user.click(buttonNamed("localSetup.requirementDownload.cancel"));
    await user.click(
      await screen.findByRole("button", {
        name: i18n.t("localSetup.requirementDownload.cancelDialog.delete")
      })
    );
    await waitFor(() =>
      expect(localSetup.cancelDownload).toHaveBeenCalledWith(
        "Qwen3.8-27B-UD-Q3_K_XL.gguf"
      )
    );
  });
});
