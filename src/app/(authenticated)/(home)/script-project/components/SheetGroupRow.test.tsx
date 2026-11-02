import { SheetGroup } from "@schemas/scriptProject";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@components/AnimatedGradient", () => ({
  AnimatedGradient: () => null
}));

vi.mock("@components/ImageThumbnail", () => ({
  ImageThumbnail: ({
    name,
    onDelete
  }: {
    name?: string;
    onDelete?: () => void;
  }) => (
    <div>
      <span>{name}</span>
      {onDelete && <button onClick={onDelete}>remove {name}</button>}
    </div>
  )
}));

vi.mock("@domains/asset/useImageAsset", () => ({
  useImageAsset: () => ({ data: undefined, isLoading: false })
}));

vi.mock("react-aria-components/FileTrigger", () => ({
  FileTrigger: ({
    children,
    onSelect
  }: {
    children: ReactNode;
    onSelect: (files: File[]) => void;
  }) => (
    <div
      data-testid="reference-file-trigger"
      onClick={() => onSelect([new File(["image"], "reference.png")])}
    >
      {children}
    </div>
  )
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) =>
      values?.count === undefined ? key : `${key}:${values.count}`
  })
}));

vi.mock("./AddImageDropTile", () => ({ AddImageDropTile: () => null }));
vi.mock("./ChangedFieldsNote", () => ({ ChangedFieldsNote: () => null }));
vi.mock("./RenderingBadge", () => ({ RenderingBadge: () => null }));
vi.mock("./SheetImageCard", () => ({ SheetImageCard: () => null }));
vi.mock("./SheetImageInputsPanel", () => ({
  SheetImageInputsPanel: () => null
}));

import { SheetGroupRow } from "./SheetGroupRow";

const group = (overrides: Partial<SheetGroup> = {}): SheetGroup => ({
  token: "hero",
  name: "Hero",
  layer_id: "layer-1",
  layer_order: 0,
  enabled: true,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: [],
  prompt: "A brave hero",
  ...overrides
});

const renderRow = (
  overrides: Partial<SheetGroup> = {},
  onRerender = vi.fn(),
  onUploadReference = vi.fn<() => Promise<string | undefined>>(),
  onSaveFields = vi.fn(),
  isRunActive = false,
  isRendering = false
) => {
  render(
    <SheetGroupRow
      group={group(overrides)}
      imageUrlsByAssetId={new Map()}
      isRendering={isRendering}
      changedPaths={undefined}
      onPin={vi.fn()}
      onSaveFields={onSaveFields}
      onToggleEnabled={vi.fn()}
      onRerender={onRerender}
      onUploadReference={onUploadReference}
      onUploadImage={vi.fn()}
      onDescribeFromImage={vi.fn()}
      isBusy={false}
      isRenderDisabled={false}
      renderCost={{ kind: "local" }}
      shouldFetchImageInputs={false}
      supportsImageReferences
      isRunActive={isRunActive}
    />
  );
  return { onRerender, onUploadReference, onSaveFields };
};

describe("SheetGroupRow render cost", () => {
  it("shows Local for a local model", () => {
    renderRow();

    expect(screen.getByText("Local")).toBeVisible();
  });

  it("shows the credit price for a Mago Cloud model", () => {
    render(
      <SheetGroupRow
        group={group()}
        imageUrlsByAssetId={new Map()}
        isRendering={false}
        changedPaths={undefined}
        onPin={vi.fn()}
        onSaveFields={vi.fn()}
        onToggleEnabled={vi.fn()}
        onRerender={vi.fn()}
        onUploadReference={vi.fn()}
        onUploadImage={vi.fn()}
        onDescribeFromImage={vi.fn()}
        isBusy={false}
        isRenderDisabled={false}
        renderCost={{ kind: "credits", amount: 120 }}
        shouldFetchImageInputs={false}
        supportsImageReferences
        isRunActive={false}
      />
    );

    expect(screen.getByText("120")).toBeVisible();
  });
});

describe("SheetGroupRow asset references", () => {
  it("renders with the persisted references and instructions", () => {
    const { onRerender } = renderRow({
      reference_asset_ids: ["reference-1", "reference-2"],
      reference_instruction: "Use the coat and hairstyle"
    });

    fireEvent.click(screen.getByTestId("sheet-group-rerender-hero"));

    expect(onRerender).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceAssetIds: ["reference-1", "reference-2"],
        referenceInstruction: "Use the coat and hairstyle"
      })
    );
  });

  it("renders references with an empty instruction", () => {
    const { onRerender } = renderRow({
      reference_asset_ids: ["reference-1"],
      reference_instruction: null
    });

    const renderButton = screen.getByTestId("sheet-group-rerender-hero");
    expect(renderButton).toBeEnabled();
    fireEvent.click(renderButton);

    expect(onRerender).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceAssetIds: ["reference-1"],
        referenceInstruction: ""
      })
    );
  });

  it("saves reference instructions on blur", () => {
    const onSaveFields = vi.fn();
    renderRow(
      {
        reference_asset_ids: ["reference-1"],
        reference_instruction: "Use the coat"
      },
      vi.fn(),
      vi.fn(),
      onSaveFields
    );

    const instruction = screen.getByTestId(
      "sheet-group-reference-instruction-hero"
    );
    fireEvent.change(instruction, {
      target: { value: "Use the coat and hairstyle" }
    });
    fireEvent.blur(instruction);

    expect(onSaveFields).toHaveBeenCalledWith({
      referenceAssetIds: ["reference-1"],
      referenceInstruction: "Use the coat and hairstyle"
    });
  });

  it("removes a persisted reference from the next render", () => {
    const { onRerender } = renderRow({
      reference_asset_ids: ["reference-1"],
      reference_instruction: "Use the coat"
    });

    fireEvent.click(screen.getByRole("button", { name: "remove reference-1" }));
    fireEvent.click(screen.getByTestId("sheet-group-rerender-hero"));

    expect(onRerender).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceAssetIds: [],
        referenceInstruction: ""
      })
    );
  });

  it("uploads and includes a new reference in the next render", async () => {
    const onUploadReference = vi.fn().mockResolvedValue("reference-new");
    const { onRerender } = renderRow({}, vi.fn(), onUploadReference);

    fireEvent.click(screen.getByTestId("reference-file-trigger"));
    await waitFor(() => expect(onUploadReference).toHaveBeenCalledOnce());
    await screen.findByTestId("sheet-group-reference-instruction-hero");
    fireEvent.change(
      screen.getByTestId("sheet-group-reference-instruction-hero"),
      { target: { value: "Use the new costume" } }
    );
    fireEvent.click(screen.getByTestId("sheet-group-rerender-hero"));

    expect(onRerender).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceAssetIds: ["reference-new"],
        referenceInstruction: "Use the new costume"
      })
    );
  });

  it("reserves one reference slot when the entity has a master image", () => {
    renderRow({ master_token: "hero-master" });

    expect(
      screen.getByText("script_project.asset_references.hint:2")
    ).toBeVisible();
  });

  it("says why the render button is disabled while a run is active", () => {
    renderRow({}, vi.fn(), vi.fn(), vi.fn(), true);

    expect(
      screen.getByTestId("sheet-group-render-blocked-hero")
    ).toHaveTextContent("script_project.render_blocked_run_active.label");
    expect(screen.getByTestId("sheet-group-rerender-hero")).toBeDisabled();
  });

  it("keeps the render button and the reference editor usable while the asset is rendering", () => {
    const { onRerender } = renderRow(
      { reference_asset_ids: ["reference-1"] },
      vi.fn(),
      vi.fn(),
      vi.fn(),
      false,
      true
    );

    const renderButton = screen.getByTestId("sheet-group-rerender-hero");
    expect(renderButton).toBeEnabled();
    expect(
      screen.getByTestId("sheet-group-reference-instruction-hero")
    ).toBeEnabled();
    expect(screen.getByTestId("sheet-group-add-reference-hero")).toBeEnabled();
    fireEvent.click(renderButton);
    expect(onRerender).toHaveBeenCalledTimes(1);
  });
});
