import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { DraftSheetGroupCard } from "./DraftSheetGroupCard";
import { SheetGroupDraft } from "./utils/sheetGroupDraft";

const emptyDraft: SheetGroupDraft = {
  draftId: "draft",
  name: "",
  kind: "character",
  prompt: "",
  referenceAssetIds: [],
  referenceInstruction: ""
};

const setup = (
  draft: SheetGroupDraft,
  existingTokens: string[] = [],
  onUploadReference = vi.fn<(file: File) => Promise<string | undefined>>()
) => {
  const onRender = vi.fn(),
    onChange = vi.fn(),
    onUploadImage = vi.fn();
  const screen = renderWithProviders(
    <DraftSheetGroupCard
      draft={draft}
      existingTokens={existingTokens}
      isBusy={false}
      isBusyWithAnythingButImageUploads={false}
      onChange={onChange}
      onRender={onRender}
      onUploadImage={onUploadImage}
      onUploadReference={onUploadReference}
    />
  );
  return { ...screen, onRender, onChange, onUploadImage };
};

describe("DraftSheetGroupCard", () => {
  it("keeps edits made during a reference upload and ignores discarded or replaced drafts", async () => {
    let finishUpload: (assetId: string) => void = () => undefined;
    const onUploadReference = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finishUpload = resolve;
        })
    );
    const screen = setup(
      { ...emptyDraft, name: "Hero", prompt: "A hero" },
      [],
      onUploadReference
    );
    const fileInput = screen.container.querySelector("input[type=file]")!;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["image"], "face.png", { type: "image/png" })]
      }
    });
    expect(screen.getByTestId("draft-sheet-group-render-draft")).toBeDisabled();
    fireEvent.change(screen.getByTestId("draft-sheet-group-prompt-draft"), {
      target: { value: "Updated hero" }
    });
    const editedDraft = screen.onChange.mock.calls[0]![0] as SheetGroupDraft;
    await act(async () => {
      finishUpload("uploaded-reference");
    });
    await waitFor(() => expect(screen.onChange).toHaveBeenCalledTimes(2));
    const applyReference = screen.onChange.mock.calls[1]![0] as (
      current: SheetGroupDraft | null
    ) => SheetGroupDraft | null;
    expect(applyReference(editedDraft)).toEqual({
      ...editedDraft,
      referenceAssetIds: ["uploaded-reference"],
      referenceInstruction: ""
    });
    expect(applyReference(null)).toBeNull();
    const replacementDraft = { ...emptyDraft, draftId: "replacement" };
    expect(applyReference(replacementDraft)).toBe(replacementDraft);
    expect(screen.getByTestId("draft-sheet-group-render-draft")).toBeEnabled();
  });
  it("includes reference images and instructions when generating an entity", () => {
    const screen = setup({
      ...emptyDraft,
      name: "Hero",
      prompt: "A hero",
      referenceAssetIds: ["reference-image"],
      referenceInstruction: "Keep the face"
    });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).toHaveBeenCalledWith({
      token: "hero",
      name: "Hero",
      kind: "character",
      prompt: "A hero",
      referenceAssetIds: ["reference-image"],
      referenceInstruction: "Keep the face"
    });
  });
  it("keeps Render disabled until the entity has a name and a prompt", () => {
    const screen = setup({ ...emptyDraft, name: "Hero" });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).not.toHaveBeenCalled();
  });

  it("renders the drafted entity under the token its name makes", () => {
    const screen = setup({
      ...emptyDraft,
      name: " Old Captain ",
      prompt: "Weathered sea captain",
      referenceAssetIds: [],
      referenceInstruction: ""
    });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).toHaveBeenCalledWith({
      token: "old_captain",
      name: "Old Captain",
      kind: "character",
      prompt: "Weathered sea captain",
      referenceAssetIds: [],
      referenceInstruction: ""
    });
  });

  it("refuses a name the cast already uses", () => {
    const screen = setup({ ...emptyDraft, name: "Hero", prompt: "A hero" }, [
      "hero"
    ]);
    expect(
      screen.getByText("The cast already has an entity with this name.")
    ).toBeTruthy();
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).not.toHaveBeenCalled();
  });

  it("reports typing to its owner", () => {
    const screen = setup(emptyDraft);
    fireEvent.change(screen.getByTestId("draft-sheet-group-name-draft"), {
      target: { value: "Hero" }
    });
    expect(screen.onChange).toHaveBeenCalledWith({
      ...emptyDraft,
      name: "Hero"
    });
  });

  it("suggests a name for the chosen category so an image can be added before typing one", () => {
    const screen = setup({ ...emptyDraft, kind: "environment" }, [
      "new_environment"
    ]);
    const nameInput = screen.getByTestId("draft-sheet-group-name-draft");
    expect(nameInput.getAttribute("placeholder")).toBe("New Environment 2");
    expect(screen.queryByText("new_environment_2")).toBeNull();
  });

  it("renders under the suggested name when no name was typed", () => {
    const screen = setup({ ...emptyDraft, prompt: "A hero" });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).toHaveBeenCalledWith({
      token: "new_character",
      name: "New Character",
      kind: "character",
      prompt: "A hero",
      referenceAssetIds: [],
      referenceInstruction: ""
    });
  });

  it("offers both ways to add the entity at once: generating from a prompt, and uploading an image", () => {
    const screen = setup(emptyDraft);

    expect(screen.getByTestId("draft-sheet-group-prompt-draft")).toBeVisible();
    expect(screen.getByTestId("draft-sheet-group-render-draft")).toBeVisible();
    expect(screen.getByTestId("draft-sheet-group-drop-draft")).toBeVisible();
  });
});
