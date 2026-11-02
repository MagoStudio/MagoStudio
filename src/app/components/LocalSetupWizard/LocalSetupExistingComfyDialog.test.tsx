import { QueryClient } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { LocalSetupExistingComfyDialog } from "./LocalSetupExistingComfyDialog";

const endpoint = "http://127.0.0.1:8188";
const missingModel = (name: string) => ({
  installKind: "model" as const,
  name,
  url: "https://huggingface.co/Comfy-Org/MiniMax-H3",
  downloadUrl: `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/${name}`,
  folder: "vae",
  status: "missing" as const
});
const videoVae = missingModel("minimax_h3_video_vae_fp16.safetensors");
const audioVae = missingModel("minimax_h3_audio_vae_fp32.safetensors");
const everyRestrictiveRepo = [
  "Comfy-Org/MiniMax-H3",
  "alibaba-pai/MiniMax-H3-Acc-LoRAs",
  "Alissonerdx/Minimax-H3-ComfyUI",
  "akatz-ai/MiniMax-H3-Character-Swap-LoRA",
  "unsloth/FLUX.2-klein-9B-GGUF",
  "Comfy-Org/vae-text-encorder-for-flux-klein-9b"
];
const downloadRequirement = vi.fn(),
  acceptedModelLicenseRepos = vi.fn(),
  acceptModelLicenses = vi.fn();

const installBridge = (models: (typeof videoVae)[]) =>
  Object.assign(window, {
    mago: {
      comfy: {
        get: async () => ({ endpoint }),
        save: async () => ({ available: true, endpoint }),
        check: async (requestedEndpoint?: string) => ({
          available: true,
          canLaunch: false,
          endpoint: requestedEndpoint ?? endpoint
        }),
        scriptSetupStatus: async () => ({
          ready: false,
          nodes: [],
          models,
          highQuality: [],
          optional: [],
          vfxLoras: []
        })
      },
      localSetup: {
        downloadRequirement,
        acceptedModelLicenseRepos,
        acceptModelLicenses,
        pauseDownload: vi.fn()
      }
    }
  });

beforeEach(() => {
  vi.resetAllMocks();
  downloadRequirement.mockResolvedValue({
    outcome: "saved",
    savedTo: "D:/ComfyUI/models/vae"
  });
  acceptModelLicenses.mockResolvedValue(undefined);
  installBridge([videoVae]);
});

const openMissingModelList = async () => {
  const screen = renderWithProviders(
    <LocalSetupExistingComfyDialog
      isOpen
      onClose={vi.fn()}
      onComplete={vi.fn()}
    />,
    {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } }
      })
    }
  );
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "ComfyUI URL" })).toHaveValue(
      endpoint
    )
  );
  await screen.findAllByRole("button", { name: /Download\.\.\./ });
  return screen;
};

const outdatedNodePack = {
  installKind: "node" as const,
  name: "UnetLoaderGGUF",
  url: "https://github.com/city96/ComfyUI-GGUF",
  downloadUrl: "https://cdn.comfy.org/city96/ComfyUI-GGUF/1.1.10/node.zip",
  downloadSha256: "a".repeat(64),
  folder: "D:/ComfyUI/custom_nodes",
  status: "missing" as const
};

const renderDialog = () =>
  renderWithProviders(
    <LocalSetupExistingComfyDialog
      isOpen
      onClose={vi.fn()}
      onComplete={vi.fn()}
    />,
    {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } }
      })
    }
  );

const unavailableAt = (requestedEndpoint: string) => ({
  available: false,
  canLaunch: false,
  endpoint: requestedEndpoint,
  message: `Cannot reach ${requestedEndpoint}`
});

describe("ComfyUI connection check", () => {
  it("checks the saved URL on open without saving it, and hides the save button until connected", async () => {
    const save = vi.fn();
    Object.assign(window.mago.comfy, {
      save,
      check: vi.fn(async (requestedEndpoint?: string) =>
        unavailableAt(requestedEndpoint ?? endpoint)
      )
    });
    const screen = renderDialog();
    expect(
      await screen.findByText(`Cannot reach ${endpoint}`)
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Save and check setup" })
    ).toBeNull();
    expect(screen.queryByTestId("launch-comfyui")).toBeNull();
  });

  it("saves and completes setup only when the user confirms this ComfyUI", async () => {
    const save = vi.fn().mockResolvedValue({ available: true, endpoint });
    const onComplete = vi.fn();
    Object.assign(window.mago.comfy, {
      save,
      scriptSetupStatus: async () => ({
        ready: true,
        nodes: [],
        models: [],
        highQuality: [],
        optional: [],
        vfxLoras: []
      })
    });
    const screen = renderWithProviders(
      <LocalSetupExistingComfyDialog
        isOpen
        onClose={vi.fn()}
        onComplete={onComplete}
      />,
      {
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false } }
        })
      }
    );
    const useThisComfy = await screen.findByRole("button", {
      name: "Use this ComfyUI"
    });
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(useThisComfy);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ endpoint }), {
      completeSetupOnConnection: true
    });
  });

  it("offers to launch ComfyUI when it is down and its launcher is known, then checks again", async () => {
    const checkEndpoint = vi
      .fn()
      .mockResolvedValueOnce(unavailableAt(endpoint))
      .mockResolvedValue({ available: true, endpoint });
    const pollSavedEndpoint = vi
      .fn()
      .mockResolvedValueOnce({ available: false, canLaunch: true })
      .mockResolvedValue({ available: true, canLaunch: true });
    const launch = vi.fn().mockResolvedValue(undefined);
    Object.assign(window.mago.comfy, {
      check: (requestedEndpoint?: string) =>
        requestedEndpoint === undefined
          ? pollSavedEndpoint()
          : checkEndpoint(requestedEndpoint),
      launch
    });
    const screen = renderDialog();
    fireEvent.click(await screen.findByTestId("launch-comfyui"));
    await screen.findAllByRole("button", { name: /Download\.\.\./ });
    expect(launch).toHaveBeenCalledOnce();
    expect(checkEndpoint).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Save and check setup" })
    ).toBeInTheDocument();
  });

  it("checks again once the ComfyUI status poll reports it responding", async () => {
    const checkEndpoint = vi
      .fn()
      .mockResolvedValueOnce(unavailableAt(endpoint))
      .mockResolvedValue({ available: true, endpoint });
    Object.assign(window.mago.comfy, {
      check: async (requestedEndpoint?: string) =>
        requestedEndpoint === undefined
          ? { available: true, canLaunch: false }
          : checkEndpoint(requestedEndpoint)
    });
    const screen = renderDialog();
    await screen.findAllByRole("button", { name: /Download\.\.\./ });
    expect(checkEndpoint).toHaveBeenCalledTimes(2);
  });

  it("checks an edited URL without saving it when the field loses focus, and again on the next blur after a failure", async () => {
    const save = vi.fn();
    const checkEndpoint = vi.fn(async (requestedEndpoint: string) =>
      unavailableAt(requestedEndpoint)
    );
    Object.assign(window.mago.comfy, {
      save,
      check: async (requestedEndpoint?: string) =>
        requestedEndpoint === undefined
          ? { available: false, canLaunch: false }
          : checkEndpoint(requestedEndpoint)
    });
    const screen = renderDialog();
    await screen.findByText(`Cannot reach ${endpoint}`);
    const urlField = screen.getByRole("textbox", { name: "ComfyUI URL" });
    fireEvent.change(urlField, { target: { value: "http://10.0.0.2:8188" } });
    fireEvent.blur(urlField);
    expect(
      await screen.findByText("Cannot reach http://10.0.0.2:8188")
    ).toBeInTheDocument();
    fireEvent.blur(urlField);
    await waitFor(() => expect(checkEndpoint).toHaveBeenCalledTimes(3));
    expect(save).not.toHaveBeenCalled();
  });
});

describe("model license notice on a ComfyUI model download", () => {
  it("asks for the licenses before the first model download, then downloads on Accept", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    const screen = await openMissingModelList();

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));

    expect(await screen.findByText("Model licenses")).toBeInTheDocument();
    expect(downloadRequirement).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole("link", { name: "MiniMax H3 Community License" })
    ).toHaveLength(4);
    expect(
      screen.getAllByRole("link", { name: "FLUX Non-Commercial License" })
    ).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Apache 2.0" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() =>
      expect(downloadRequirement).toHaveBeenCalledWith(videoVae.name, {
        replaceExistingNodePackIn: undefined
      })
    );
    expect(acceptModelLicenses).toHaveBeenCalledWith(everyRestrictiveRepo);
  });

  it("starts nothing when the license notice is closed", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    const screen = await openMissingModelList();

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));
    await screen.findByText("Model licenses");
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);

    await waitFor(() =>
      expect(screen.queryByText("Model licenses")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Using your own ComfyUI")).toBeInTheDocument();
    expect(downloadRequirement).not.toHaveBeenCalled();
    expect(acceptModelLicenses).not.toHaveBeenCalled();
  });

  it("downloads at once when every restrictive license was accepted before", async () => {
    acceptedModelLicenseRepos.mockResolvedValue(everyRestrictiveRepo);
    const screen = await openMissingModelList();

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));

    await waitFor(() =>
      expect(downloadRequirement).toHaveBeenCalledWith(videoVae.name, {
        replaceExistingNodePackIn: undefined
      })
    );
    expect(screen.queryByText("Model licenses")).not.toBeInTheDocument();
  });

  it("asks again, listing only the new license, when a restrictive model was added since the last acceptance", async () => {
    acceptedModelLicenseRepos.mockResolvedValue(["Comfy-Org/MiniMax-H3"]);
    const screen = await openMissingModelList();

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));

    await screen.findByText("Model licenses");
    expect(screen.getByText("MiniMax H3 8-step LoRA")).toBeInTheDocument();
    expect(screen.queryByText("MiniMax H3")).not.toBeInTheDocument();
    expect(downloadRequirement).not.toHaveBeenCalled();
  });

  it("does not show an earlier failed accept when the notice is closed and opened again", async () => {
    acceptedModelLicenseRepos.mockResolvedValue([]);
    acceptModelLicenses.mockRejectedValueOnce(new Error("Disk write failed"));
    const screen = await openMissingModelList();

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));
    await screen.findByText("Model licenses");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText("Disk write failed")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    await waitFor(() =>
      expect(screen.queryByText("Model licenses")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Download\.\.\./ }));

    await screen.findByText("Model licenses");
    expect(screen.queryByText("Disk write failed")).not.toBeInTheDocument();
  });

  it("shows one license notice for several missing models, and starts the download of the model that asked", async () => {
    installBridge([videoVae, audioVae]);
    acceptedModelLicenseRepos.mockResolvedValue([]);
    const screen = await openMissingModelList();
    const [, audioVaeDownload] = screen.getAllByRole("button", {
      name: /Download\.\.\./
    });

    fireEvent.click(audioVaeDownload);

    await screen.findByText("Model licenses");
    expect(screen.getAllByText("Model licenses")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() =>
      expect(downloadRequirement).toHaveBeenCalledWith(audioVae.name, {
        replaceExistingNodePackIn: undefined
      })
    );
    expect(downloadRequirement).toHaveBeenCalledTimes(1);
  });
});

describe("updating an installed node pack from the ComfyUI dialog", () => {
  it("asks before replacing the installed pack, then updates it in the same folder", async () => {
    installBridge([]);
    Object.assign(window.mago.comfy, {
      scriptSetupStatus: async () => ({
        ready: false,
        nodes: [outdatedNodePack],
        models: [],
        highQuality: [],
        optional: [],
        vfxLoras: []
      })
    });
    downloadRequirement.mockResolvedValueOnce({
      outcome: "node-pack-update-needs-confirmation",
      customNodesFolder: "D:/ComfyUI/custom_nodes",
      nodePackDirectory: "D:/ComfyUI/custom_nodes/ComfyUI-GGUF",
      backupsFolder: "D:/ComfyUI/backups"
    });
    const screen = renderDialog();

    fireEvent.click(
      await screen.findByRole("button", { name: /Download and install/ })
    );

    expect(
      await screen.findByText("Update this node pack?")
    ).toBeInTheDocument();
    expect(downloadRequirement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Update node pack" }));

    await waitFor(() =>
      expect(downloadRequirement).toHaveBeenLastCalledWith("UnetLoaderGGUF", {
        replaceExistingNodePackIn: "D:/ComfyUI/custom_nodes"
      })
    );
  });
});
