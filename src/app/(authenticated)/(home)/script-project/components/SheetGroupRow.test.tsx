import { SheetGroupSchema } from "@schemas/scriptProject";
import { fireEvent, within } from "@testing-library/react";
import { t } from "@tests/utils/i18n";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ScriptProjectRenderCost } from "./RenderCostLabel";
import { SheetGroupRow } from "./SheetGroupRow";

vi.mock("@domains/asset/useImageAsset", () => ({
  useImageAsset: () => ({ data: undefined, isLoading: false })
}));
vi.mock("@components/ImageThumbnail", () => ({
  ImageThumbnail: ({
    onDelete,
    name
  }: {
    onDelete?: () => void;
    name: string;
  }) => <button onClick={onDelete}>Remove {name}</button>
}));

const setup = (
  withReferences = false,
  masterToken?: string,
  localProps: Partial<{
    renderCost: ScriptProjectRenderCost;
    isCharacterVoiceAvailableForProject: boolean;
  }> = {}
) => {
  const group = SheetGroupSchema.parse({
    token: "hero",
    name: "Hero",
    kind: "character",
    layer_id: "layer",
    images: [],
    prompt: "Original",
    reference_asset_ids: withReferences ? ["ref"] : [],
    reference_instruction: withReferences ? "Use the face" : null,
    master_token: masterToken
  });
  const onSaveFields = vi.fn(),
    onRerender = vi.fn();
  const props = {
    group,
    imageUrlsByAssetId: new Map(),
    changedPaths: undefined,
    isRendering: false,
    isBusy: false,
    isBusyWithAnythingButImageUploads: false,
    isUploadingImage: false,
    isRunActive: false,
    onPin: vi.fn(),
    onSaveFields,
    onToggleEnabled: vi.fn(),
    onRerender,
    onUploadReference: vi.fn(),
    onUploadImage: vi.fn(),
    onDescribeFromImage: vi.fn(),
    projectId: "project",
    timelineId: "timeline",
    isRenderDisabled: false,
    renderCost: { kind: "local" } as ScriptProjectRenderCost,
    supportsImageReferences: true,
    isCharacterVoiceAvailableForProject: false,
    ...localProps
  };
  const screen = renderWithProviders(
    <SheetGroupRow key={group.token} {...props} />
  );
  return { ...screen, props, onSaveFields, onRerender };
};
describe("asset text and references", () => {
  it("preserves an in-progress prompt when reference autosave refreshes the row", () => {
    const screen = setup(true);
    const instructions = screen.getByTestId(
      "sheet-group-reference-instruction-hero"
    );
    fireEvent.change(instructions, { target: { value: "Use the costume" } });
    fireEvent.blur(instructions);
    const prompt = screen.getByTestId("sheet-group-prompt-hero");
    fireEvent.change(prompt, { target: { value: "Still editing" } });
    screen.rerender(
      <SheetGroupRow
        key="hero"
        {...screen.props}
        group={{
          ...screen.props.group,
          reference_instruction: "Use the costume"
        }}
      />
    );
    expect(screen.getByTestId("sheet-group-prompt-hero")).toHaveValue(
      "Still editing"
    );
    fireEvent.blur(screen.getByTestId("sheet-group-prompt-hero"));
    expect(screen.onSaveFields).toHaveBeenLastCalledWith(
      expect.objectContaining({ prompt: "Still editing" })
    );
  });

  it("refreshes saved reference images without remounting the row", () => {
    const screen = setup(true);
    screen.rerender(
      <SheetGroupRow
        key="hero"
        {...screen.props}
        group={{
          ...screen.props.group,
          reference_asset_ids: ["replacement"]
        }}
      />
    );
    expect(screen.queryByRole("button", { name: "Remove ref" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove replacement" })
    ).toBeInTheDocument();
  });
  it("saves asset prompts and reference instructions on blur", () => {
    const screen = setup(true);
    const prompt = screen.getByTestId("sheet-group-prompt-hero");
    fireEvent.change(prompt, { target: { value: "Edited" } });
    fireEvent.blur(prompt);
    expect(screen.onSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Edited" })
    );
    const instructions = screen.getByTestId(
      "sheet-group-reference-instruction-hero"
    );
    fireEvent.change(instructions, { target: { value: "Use the costume" } });
    fireEvent.blur(instructions);
    expect(screen.onSaveFields).toHaveBeenCalledWith({
      referenceAssetIds: ["ref"],
      referenceInstruction: "Use the costume"
    });
    expect(screen.queryByRole("button", { name: /^Save$/u })).toBeNull();
  });
  it("immediately persists removal of the last reference and clears its instruction", () => {
    const screen = setup(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove ref" }));
    expect(screen.onSaveFields).toHaveBeenCalledWith({
      referenceAssetIds: [],
      referenceInstruction: null
    });
  });
  it("renders references with an empty instruction, sending the current draft directly", () => {
    const screen = setup(true);
    const instructions = screen.getByTestId(
      "sheet-group-reference-instruction-hero"
    );
    const render = screen.getByTestId("sheet-group-rerender-hero");
    fireEvent.change(instructions, { target: { value: "" } });
    expect(render).toBeEnabled();
    fireEvent.click(render);
    expect(screen.onRerender).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceAssetIds: ["ref"],
        referenceInstruction: ""
      })
    );
  });
  it("saves a cleared instruction as empty instead of refusing to save", () => {
    const screen = setup(true);
    const instructions = screen.getByTestId(
      "sheet-group-reference-instruction-hero"
    );
    fireEvent.change(instructions, { target: { value: "" } });
    fireEvent.blur(instructions);
    expect(screen.onSaveFields).toHaveBeenCalledWith({
      referenceAssetIds: ["ref"],
      referenceInstruction: ""
    });
  });
  it("shows and saves a default instruction the moment the first reference is uploaded", async () => {
    const screen = setup(false);
    screen.props.onUploadReference.mockResolvedValue("uploaded");
    const referenceFileInput = screen
      .getByTestId("sheet-group-add-reference-hero")
      .parentElement!.querySelector("input[type=file]")!;
    fireEvent.change(referenceFileInput, {
      target: {
        files: [new File(["x"], "face.png", { type: "image/png" })]
      }
    });
    const instructions = await screen.findByTestId(
      "sheet-group-reference-instruction-hero"
    );
    expect(instructions).toHaveValue(
      "Use these images as visual references for this entity."
    );
    expect(screen.onSaveFields).toHaveBeenCalledWith({
      referenceAssetIds: ["uploaded"],
      referenceInstruction:
        "Use these images as visual references for this entity."
    });
  });
  it("says why the render button is disabled while a run is active", () => {
    const screen = setup(false);
    screen.rerender(<SheetGroupRow key="hero" {...screen.props} isRunActive />);
    expect(
      screen.getByTestId("sheet-group-render-blocked-hero")
    ).toHaveTextContent("Wait for the current run to finish.");
  });
  it("keeps the render button and the reference editor usable while the asset is rendering", () => {
    const screen = setup(true);
    screen.rerender(<SheetGroupRow key="hero" {...screen.props} isRendering />);
    const render = screen.getByTestId("sheet-group-rerender-hero");
    expect(render).toBeEnabled();
    expect(
      screen.getByTestId("sheet-group-reference-instruction-hero")
    ).toBeEnabled();
    expect(screen.getByTestId("sheet-group-add-reference-hero")).toBeEnabled();
    fireEvent.click(render);
    expect(screen.onRerender).toHaveBeenCalledTimes(1);
  });
  it("disables the render button while a run is active", () => {
    const screen = setup(false);
    screen.rerender(<SheetGroupRow key="hero" {...screen.props} isRunActive />);
    expect(screen.getByTestId("sheet-group-rerender-hero")).toBeDisabled();
  });
  it("reserves a reference slot for the master of a variant", () => {
    const screen = setup(false, "master");
    screen.rerender(
      <SheetGroupRow
        key="hero"
        {...screen.props}
        group={{
          ...screen.props.group,
          reference_asset_ids: ["ref", "second-ref"]
        }}
      />
    );
    expect(screen.getByTestId("sheet-group-add-reference-hero")).toBeDisabled();
  });
  it("leaves room for a third reference on an asset that is not a variant", () => {
    const screen = setup(false);
    screen.rerender(
      <SheetGroupRow
        key="hero"
        {...screen.props}
        group={{
          ...screen.props.group,
          reference_asset_ids: ["ref", "second-ref"]
        }}
      />
    );
    expect(screen.getByTestId("sheet-group-add-reference-hero")).toBeEnabled();
  });
});

describe("image drop tile", () => {
  it("stays usable and still while another entity's image uploads", () => {
    const screen = setup();
    screen.rerender(<SheetGroupRow key="hero" {...screen.props} isBusy />);
    const dropTile = within(screen.getByTestId("sheet-group-drop-hero"));

    expect(dropTile.queryByRole("progressbar")).toBeNull();
    expect(
      dropTile
        .getByText(t("script_project.drop_image_hint.label"))
        .closest("button")
    ).toBeEnabled();
  });

  it("spins and takes no second file while this entity's own image uploads", () => {
    const screen = setup();
    screen.rerender(
      <SheetGroupRow key="hero" {...screen.props} isBusy isUploadingImage />
    );
    const dropTile = within(screen.getByTestId("sheet-group-drop-hero"));

    expect(dropTile.getByRole("progressbar").closest("button")).toBeDisabled();
  });
});

describe("local render cost and voice", () => {
  it("shows Local on Generate for a local model", () => {
    const screen = setup();

    expect(
      within(screen.getByTestId("sheet-group-rerender-hero")).getByText("Local")
    ).toBeVisible();
  });

  it("shows the credit price on Generate for a Mago Cloud model", () => {
    const screen = setup(false, undefined, {
      renderCost: { kind: "credits", amount: 120 }
    });

    expect(
      within(screen.getByTestId("sheet-group-rerender-hero")).getByText("120")
    ).toBeVisible();
  });

  it("offers a character voice on a cloud project", () => {
    const screen = setup(false, undefined, {
      isCharacterVoiceAvailableForProject: true
    });

    expect(screen.getAllByText(t("script_project.voice.title")).length).toBe(1);
  });

  it("shows no All versions section while the first version renders", () => {
    const screen = renderWithProviders(
      <SheetGroupRow {...setup().props} key="rendering" isRendering />
    );

    expect(
      screen.queryByText(t("script_project.all_versions.label"))
    ).toBeNull();
  });

  it("offers no character voice on a local project", () => {
    const screen = setup(false, undefined, {
      isCharacterVoiceAvailableForProject: false
    });

    expect(screen.queryByText(t("script_project.voice.title"))).toBeNull();
    expect(
      screen.queryByText(t("script_project.voice.add_voice_button.label"))
    ).toBeNull();
  });
});
