import { i18n } from "@config/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createModelSettingsFixture } from "@/stories/fixtures/createModelSettingsFixture";

import { LOCAL_MODEL_LICENSES } from "../../../../../../../desktop/shared/localModelLicenses";

import { LocalModelSettingsPanel } from "./LocalModelSettingsPanel";

describe("LocalModelSettingsPanel", () => {
  let fixture: ReturnType<typeof createModelSettingsFixture>;
  beforeEach(() => {
    void i18n.changeLanguage("en");
    fixture = createModelSettingsFixture();
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: { models: fixture.api }
    });
  });
  afterEach(() => vi.restoreAllMocks());
  const mount = () =>
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <LocalModelSettingsPanel endpoint="http://127.0.0.1:8188" />
      </QueryClientProvider>
    );
  const selectModel = async (name: string) => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Model type/ }));
    await user.click(
      await screen.findByRole("option", {
        name: (accessibleName) => accessibleName.startsWith(name)
      })
    );
  };
  const openFileList = async () => {
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: /Existing model file/ })
    );
    return screen.findByRole("listbox");
  };
  const selectFile = async (filename: string) => {
    const user = userEvent.setup();
    await openFileList();
    await user.click(
      await screen.findByRole("option", {
        name: (accessibleName) => accessibleName.includes(filename)
      })
    );
  };
  it("shows ready, missing and failed component marks without opening each component", async () => {
    const inspect = fixture.api.inspect;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) => {
      const snapshot = await inspect(request);
      if (request.model === "minimax") {
        snapshot.components.find((item) => item.role === "audioVae")!.status =
          "missing";
        snapshot.components.find((item) => item.role === "lora")!.problem = {
          status: "error",
          message: "Load failed"
        };
      }
      return snapshot;
    });
    mount();
    await screen.findByLabelText("Model variant");
    await selectModel("MiniMax H3");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Component/ }));
    const ready = await screen.findByRole("option", { name: /^Video VAE/ });
    const missing = screen.getByRole("option", { name: /^Audio VAE/ });
    const failed = screen.getByRole("option", { name: /^Workflow LoRA/ });
    expect(
      within(ready).getByLabelText(
        i18n.t("localSettings.statusMark.ready", { label: "Video VAE" })
      )
    ).toBeInTheDocument();
    for (const [option, label] of [
      [missing, "Audio VAE"],
      [failed, "Workflow LoRA"]
    ] as const) {
      expect(
        within(option).getByLabelText(
          i18n.t("localSettings.statusMark.needsAttention", { label })
        )
      ).toBeInTheDocument();
    }
    await user.click(missing);
    expect(screen.getByRole("button", { name: /Component/ })).toHaveTextContent(
      "Audio VAE"
    );
  });
  it("offers a missing recommended file with a download instead of listing it as a local file", async () => {
    const inspect = fixture.api.inspect;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) => {
      const snapshot = await inspect(request);
      if (request.model === "text") {
        snapshot.components[0].status = "missing";
        snapshot.components[0].path = null;
        snapshot.components[0].recommendedFile.isInstalled = false;
        snapshot.components[0].choices = [
          {
            filename: "Qwen3.8-27B-UD-Q5_K_XL.gguf",
            path: "D:/models/Qwen3.8-27B-UD-Q5_K_XL.gguf",
            hasPassedModelCheck: false,
            loadTestOutcome: "untested",
            missingNodes: [],
            latestFileCheck: null,
            sourceUrl: null,
            expectedSha256: null,
            actualSha256: null
          }
        ];
      }
      return snapshot;
    });
    mount();
    const trigger = await screen.findByRole("button", {
      name: /Existing model file/
    });
    expect(trigger).toHaveTextContent("Qwen3.8-27B-UD-Q3_K_XL.gguf");
    expect(trigger).toHaveTextContent("Not installed");
    expect(
      screen.getByText("This file is not installed on the ComfyUI host yet.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download..." })
    ).toBeInTheDocument();
    await selectFile("Qwen3.8-27B-UD-Q5_K_XL.gguf");
    expect(
      screen.queryByRole("button", { name: "Download..." })
    ).not.toBeInTheDocument();
    await screen.findByText(
      "Settings saved. Changes apply to the next model load."
    );
    expect(fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]).toBe(
      "Qwen3.8-27B-UD-Q5_K_XL.gguf"
    );
  });
  it("lists the recommended file once and marks installed and checked files", async () => {
    const inspect = fixture.api.inspect;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) => {
      const snapshot = await inspect(request);
      if (request.model === "text") {
        const [main] = snapshot.components;
        main.recommendedFile.filename = "qwen3.8-27b-ud-q3_k_xl.gguf";
        main.choices = [
          {
            filename: "qwen3.8-27b-ud-q3_k_xl.gguf",
            path: "D:/models/qwen3.8-27b-ud-q3_k_xl.gguf",
            hasPassedModelCheck: false,
            loadTestOutcome: "untested",
            missingNodes: [],
            latestFileCheck: null,
            sourceUrl: null,
            expectedSha256: null,
            actualSha256: null
          },
          {
            filename: "custom-main.gguf",
            path: "D:/models/custom-main.gguf",
            hasPassedModelCheck: true,
            loadTestOutcome: "untested",
            missingNodes: [],
            latestFileCheck: null,
            sourceUrl: null,
            expectedSha256: null,
            actualSha256: null
          },
          {
            filename: "wrong-shape.gguf",
            path: "D:/models/wrong-shape.gguf",
            hasPassedModelCheck: false,
            loadTestOutcome: "untested",
            missingNodes: [],
            latestFileCheck: null,
            sourceUrl: null,
            expectedSha256: null,
            actualSha256: null
          }
        ];
      }
      return snapshot;
    });
    mount();
    const list = await openFileList();
    const [recommendedSection, localSection] =
      within(list).getAllByRole("group");
    expect(
      within(recommendedSection).getByText("Recommended model")
    ).toBeInTheDocument();
    expect(
      within(recommendedSection)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["✓qwen3.8-27b-ud-q3_k_xl.gguf"]);
    expect(within(localSection).getByText("Local files")).toBeInTheDocument();
    expect(
      within(localSection)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["✓custom-main.gguf", "wrong-shape.gguf"]);
    expect(
      within(recommendedSection).getByLabelText(
        i18n.t("localSettings.statusMark.ready", {
          label: "qwen3.8-27b-ud-q3_k_xl.gguf: installed"
        })
      )
    ).toBeInTheDocument();
    expect(
      within(localSection).getByLabelText(
        i18n.t("localSettings.statusMark.ready", {
          label: "custom-main.gguf: passed a check"
        })
      )
    ).toBeInTheDocument();
  });
  it("moves Q3/Q5 inside model settings and preserves choices while inspecting another model", async () => {
    mount();
    await screen.findByLabelText("Model variant");
    expect(screen.getByLabelText("Model variant")).toHaveValue("auto");
    fireEvent.change(screen.getByLabelText("Model variant"), {
      target: { value: "qwen38-27b-q5" }
    });
    await screen.findByText(
      "Settings saved. Changes apply to the next model load."
    );
    expect(fixture.settings.models.text?.variant).toBe("qwen38-27b-q5");
    await selectModel("MiniMax H3");
    await screen.findByRole("button", { name: /Component/ });
    expect(
      screen.getByRole("button", { name: /Model type/ })
    ).toHaveTextContent("MiniMax H3");
    await selectModel("Qwen3.8 27B");
    await waitFor(() =>
      expect(screen.getByLabelText("Model variant")).toHaveValue(
        "qwen38-27b-q5"
      )
    );
  });
  it("checks a picked file and keeps the file in use when the check fails", async () => {
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    for (const removedButton of [
      "Check compatibility",
      "Use this file",
      "Restore recommended"
    ])
      expect(
        screen.queryByRole("button", { name: removedButton })
      ).not.toBeInTheDocument();
    await selectFile("wrong-shape.gguf");
    const mismatch = await screen.findByText(
      "Tensor shape mismatch against the recommended component"
    );
    expect(mismatch.closest('[role="status"]')).toBeInTheDocument();
    expect(fixture.settings.models.text).toBeUndefined();
    expect(
      screen.getByText("Current file: Qwen3.8-27B-UD-Q3_K_XL.gguf")
    ).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByTestId("model-file-details-button"));
    const details = await screen.findByRole("dialog");
    expect(details).toHaveTextContent('"comparedTensors": 0');
    expect(
      within(details).getByRole("button", { name: "Test candidate load" })
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("button", { name: "Compute file hash" })
    ).toBeInTheDocument();
  });
  it("uses a picked file once its check passes and reverts when the recommended file is picked", async () => {
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    const checkSpy = vi.spyOn(fixture.api, "check");
    await selectFile("custom-main.gguf");
    const saved = await screen.findByText(
      "Settings saved. Changes apply to the next model load."
    );
    expect(saved.closest('[role="status"]')?.textContent).toBe(
      "Settings saved. Changes apply to the next model load."
    );
    expect(checkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "compatibility",
        filename: "custom-main.gguf"
      })
    );
    expect(fixture.settings.models.text?.variant).toBe("qwen38-27b-q3");
    expect(fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]).toBe(
      "custom-main.gguf"
    );
    await screen.findByText("Current file: custom-main.gguf");
    checkSpy.mockClear();
    await selectFile("Qwen3.8-27B-UD-Q3_K_XL.gguf");
    await screen.findByText("Current file: Qwen3.8-27B-UD-Q3_K_XL.gguf");
    expect(
      fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]
    ).toBeUndefined();
    expect(checkSpy).not.toHaveBeenCalled();
  });
  const mockMissingRecommendedFileDownload = () => {
    let isRecommendedFileDownloaded = false;
    const inspect = fixture.api.inspect;
    const save = fixture.api.save;
    const reportRecommendedFileState = (
      snapshot: Awaited<ReturnType<typeof fixture.api.inspect>>
    ) => {
      snapshot.components[0].recommendedFile.isInstalled =
        isRecommendedFileDownloaded;
      if (!isRecommendedFileDownloaded)
        snapshot.components[0].choices = snapshot.components[0].choices.filter(
          (choice) => choice.filename !== snapshot.components[0].filename
        );
      return snapshot;
    };
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) =>
      reportRecommendedFileState(await inspect(request))
    );
    vi.spyOn(fixture.api, "save").mockImplementation(async (request) =>
      reportRecommendedFileState(await save(request))
    );
    const downloadRequirement = vi.fn(async () => {
      isRecommendedFileDownloaded = true;
      return { outcome: "saved" as const, savedTo: "D:/ComfyUI/models" };
    });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        models: fixture.api,
        localSetup: {
          downloadRequirement,
          acceptedModelLicenseRepos: async () =>
            LOCAL_MODEL_LICENSES.map((license) => license.huggingFaceRepo)
        }
      }
    });
    return downloadRequirement;
  };
  const downloadRecommendedFile = async () => {
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Download..." })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Download..." })
      ).not.toBeInTheDocument()
    );
  };
  it("uses a downloaded recommended file when no other file was set up", async () => {
    const downloadRequirement = mockMissingRecommendedFileDownload();
    mount();
    await screen.findByText("Current file: Qwen3.8-27B-UD-Q3_K_XL.gguf");
    await downloadRecommendedFile();
    expect(downloadRequirement).toHaveBeenCalled();
    expect(
      fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]
    ).toBeUndefined();
    const trigger = screen.getByRole("button", {
      name: /Existing model file/
    });
    await waitFor(() => expect(trigger).not.toHaveTextContent("Not installed"));
    expect(trigger).toHaveTextContent("Qwen3.8-27B-UD-Q3_K_XL.gguf");
    expect(
      screen.getByText("Current file: Qwen3.8-27B-UD-Q3_K_XL.gguf")
    ).toBeInTheDocument();
  });
  it("keeps the file that was set up when the recommended file finishes downloading", async () => {
    const downloadRequirement = mockMissingRecommendedFileDownload();
    mount();
    await screen.findByText("Current file: Qwen3.8-27B-UD-Q3_K_XL.gguf");
    await selectFile("custom-main.gguf");
    await screen.findByText("Current file: custom-main.gguf");
    await selectFile("Qwen3.8-27B-UD-Q3_K_XL.gguf");
    await downloadRecommendedFile();
    expect(downloadRequirement).toHaveBeenCalled();
    expect(fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]).toBe(
      "custom-main.gguf"
    );
    expect(
      screen.getByText("Current file: custom-main.gguf")
    ).toBeInTheDocument();
  });
  it("reverts without a check when the recommended file is installed with different casing", async () => {
    const lowercaseRecommendedFilename = "qwen3.8-27b-ud-q3_k_xl.gguf";
    const installRecommendedFileInLowercase = (
      snapshot: Awaited<ReturnType<typeof fixture.api.inspect>>
    ) => {
      const textComponent = snapshot.components[0];
      textComponent.recommendedFile.filename = lowercaseRecommendedFilename;
      textComponent.choices = textComponent.choices.map((choice) =>
        choice.filename === textComponent.filename
          ? { ...choice, filename: lowercaseRecommendedFilename }
          : choice
      );
      return snapshot;
    };
    const inspect = fixture.api.inspect;
    const save = fixture.api.save;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) =>
      request.model === "text"
        ? installRecommendedFileInLowercase(await inspect(request))
        : inspect(request)
    );
    vi.spyOn(fixture.api, "save").mockImplementation(async (request) =>
      request.model === "text"
        ? installRecommendedFileInLowercase(await save(request))
        : save(request)
    );
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    await selectFile("custom-main.gguf");
    await screen.findByText("Current file: custom-main.gguf");
    const checkSpy = vi.spyOn(fixture.api, "check");
    await selectFile(lowercaseRecommendedFilename);
    await waitFor(() =>
      expect(
        fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]
      ).toBeUndefined()
    );
    expect(checkSpy).not.toHaveBeenCalled();
  });
  it("shows the last check of the picked file next to its details button", async () => {
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    expect(
      await screen.findByTestId("model-file-last-check")
    ).toHaveTextContent("Not checked yet");
    await selectFile("custom-main.gguf");
    await screen.findByText("Current file: custom-main.gguf");
    await waitFor(() =>
      expect(screen.getByTestId("model-file-last-check").textContent).toMatch(
        /^Last check: compatibility passed, .*2026/
      )
    );
    expect(screen.getByTestId("model-file-last-check").nextElementSibling).toBe(
      screen.getByTestId("model-file-details-button")
    );
  });
  const reportCustomMainLoadTest = (
    readLoadTestOutcome: () => "passed" | "failed" | "untested"
  ) => {
    const inspect = fixture.api.inspect;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) => {
      const snapshot = await inspect(request);
      const loadTestOutcome = readLoadTestOutcome();
      snapshot.components[0].choices = snapshot.components[0].choices.map(
        (choice) =>
          choice.filename === "custom-main.gguf"
            ? {
                ...choice,
                hasPassedModelCheck: loadTestOutcome === "passed",
                loadTestOutcome
              }
            : choice
      );
      return snapshot;
    });
  };
  it("uses a picked file once its candidate load test passes after an inconclusive check", async () => {
    let hasLoadTestPassed = false;
    reportCustomMainLoadTest(() => (hasLoadTestPassed ? "passed" : "untested"));
    vi.spyOn(fixture.api, "check").mockImplementation(async (request) => {
      if (request.action !== "load")
        return {
          status: "unknown",
          message: "No comparable reference",
          details: { action: request.action }
        };
      hasLoadTestPassed = true;
      return {
        status: "success",
        message: "Loaded",
        details: { action: "load" }
      };
    });
    const user = userEvent.setup();
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    await selectFile("custom-main.gguf");
    await screen.findByText("No comparable reference");
    expect(
      fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]
    ).toBeUndefined();
    await user.click(screen.getByTestId("model-file-details-button"));
    await user.click(
      await screen.findByRole("button", { name: "Test candidate load" })
    );
    await waitFor(() =>
      expect(fixture.settings.models.text?.bindings["qwen38-27b-q3:main"]).toBe(
        "custom-main.gguf"
      )
    );
  });
  it("does not check a picked file whose last load test failed", async () => {
    reportCustomMainLoadTest(() => "failed");
    const checkSpy = vi.spyOn(fixture.api, "check");
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    await selectFile("custom-main.gguf");
    expect(
      await screen.findByText(i18n.t("modelSettings.fileFailedLoadTest"))
    ).toBeInTheDocument();
    expect(checkSpy).not.toHaveBeenCalled();
  });
  it("describes the picked file in the details popover and hashes that file", async () => {
    const user = userEvent.setup();
    const checkSpy = vi.spyOn(fixture.api, "check");
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    await selectFile("wrong-shape.gguf");
    await screen.findByText(
      "Tensor shape mismatch against the recommended component"
    );
    await user.click(screen.getByTestId("model-file-details-button"));
    expect(
      await screen.findByText(/^Path: .*wrong-shape\.gguf$/)
    ).toBeInTheDocument();
    checkSpy.mockClear();
    await user.click(screen.getByRole("button", { name: "Compute file hash" }));
    await waitFor(() =>
      expect(checkSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "hash",
          filename: "wrong-shape.gguf"
        })
      )
    );
  });
  it("lists missing nodes above the files and does not switch to a file that needs them", async () => {
    const inspect = fixture.api.inspect;
    vi.spyOn(fixture.api, "inspect").mockImplementation(async (request) => {
      const snapshot = await inspect(request);
      const customMain = snapshot.components[0].choices.find(
        (choice) => choice.filename === "custom-main.gguf"
      );
      if (customMain)
        customMain.missingNodes = [
          {
            name: "UnetLoaderGGUF",
            url: "https://github.com/city96/ComfyUI-GGUF",
            installKind: "node",
            status: "missing",
            downloadUrl: "https://example.test/ComfyUI-GGUF.zip"
          }
        ];
      return snapshot;
    });
    const checkSpy = vi.spyOn(fixture.api, "check");
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    expect(screen.queryByTestId("missing-model-nodes")).not.toBeInTheDocument();
    await selectFile("custom-main.gguf");
    const missingNodes = await screen.findByTestId("missing-model-nodes");
    expect(missingNodes).toHaveTextContent(
      "Missing ComfyUI nodes for custom-main.gguf"
    );
    expect(missingNodes).toHaveTextContent("Missing nodes: UnetLoaderGGUF");
    expect(
      within(missingNodes).getByRole("link", { name: "ComfyUI-GGUF" })
    ).toBeInTheDocument();
    expect(
      within(missingNodes).getByRole("button", {
        name: "Download and install..."
      })
    ).toBeInTheDocument();
    const filesHeading = screen.getByRole("heading", {
      name: "Files & variants"
    });
    expect(
      missingNodes.compareDocumentPosition(filesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(checkSpy).not.toHaveBeenCalled();
    expect(fixture.settings.models.text).toBeUndefined();
    expect(
      within(
        screen.getByRole("button", { name: /Existing model file/ })
      ).queryByLabelText(
        i18n.t("localSettings.statusMark.ready", {
          label: "custom-main.gguf: passed a check"
        })
      )
    ).not.toBeInTheDocument();
  });
  it("shows MiniMax memory controls and keeps text-only GPU-layer controls on text models", async () => {
    mount();
    await screen.findByRole("button", { name: /Existing model file/ });
    await selectModel("MiniMax H3");
    await screen.findByRole("button", { name: /Component/ });
    expect(
      screen.getByRole("heading", { name: "Load settings" })
    ).toBeVisible();
    expect(await screen.findByLabelText("ComfyUI memory policy")).toHaveValue(
      "auto"
    );
    expect(screen.queryByLabelText("GPU layers")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("ComfyUI memory policy"), {
      target: { value: "low-vram" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save load settings" }));
    await screen.findByText(
      "Saved. Restart ComfyUI when idle to apply the server memory policy."
    );
    expect(fixture.settings.memoryPolicy).toBe("low-vram");
  });
});
