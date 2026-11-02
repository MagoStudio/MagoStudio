import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { DraftSheetGroupCard } from "./DraftSheetGroupCard";
import { SheetGroupDraft } from "./utils/sheetGroupDraft";

const emptyDraft: SheetGroupDraft = {
  draftId: "draft",
  name: "",
  kind: "character",
  prompt: ""
};

const setup = (draft: SheetGroupDraft, existingTokens: string[] = []) => {
  const onRender = vi.fn(),
    onChange = vi.fn(),
    onDiscard = vi.fn(),
    onUploadImage = vi.fn();
  const screen = renderWithProviders(
    <DraftSheetGroupCard
      draft={draft}
      existingTokens={existingTokens}
      isBusy={false}
      onChange={onChange}
      onRender={onRender}
      onUploadImage={onUploadImage}
      onDiscard={onDiscard}
    />
  );
  return { ...screen, onRender, onChange, onDiscard, onUploadImage };
};

describe("DraftSheetGroupCard", () => {
  it("keeps Render disabled until the entity has a name and a prompt", () => {
    const screen = setup({ ...emptyDraft, name: "Hero" });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).not.toHaveBeenCalled();
  });

  it("renders the drafted entity under the token its name makes", () => {
    const screen = setup({
      ...emptyDraft,
      name: " Old Captain ",
      prompt: "Weathered sea captain"
    });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).toHaveBeenCalledWith({
      token: "old_captain",
      name: "Old Captain",
      kind: "character",
      prompt: "Weathered sea captain"
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

  it("reports typing and discarding to its owner", () => {
    const screen = setup(emptyDraft);
    fireEvent.change(screen.getByTestId("draft-sheet-group-name-draft"), {
      target: { value: "Hero" }
    });
    expect(screen.onChange).toHaveBeenCalledWith({
      ...emptyDraft,
      name: "Hero"
    });
    fireEvent.click(screen.getByTestId("draft-sheet-group-discard-draft"));
    expect(screen.onDiscard).toHaveBeenCalled();
  });

  it("suggests a name for the chosen category so an image can be added before typing one", () => {
    const screen = setup({ ...emptyDraft, kind: "environment" }, [
      "new_environment"
    ]);
    const nameInput = screen.getByTestId("draft-sheet-group-name-draft");
    expect(nameInput.getAttribute("placeholder")).toBe("New Environment 2");
    expect(screen.getByText("new_environment_2")).toBeTruthy();
  });

  it("renders under the suggested name when no name was typed", () => {
    const screen = setup({ ...emptyDraft, prompt: "A hero" });
    fireEvent.click(screen.getByTestId("draft-sheet-group-render-draft"));
    expect(screen.onRender).toHaveBeenCalledWith({
      token: "new_character",
      name: "New Character",
      kind: "character",
      prompt: "A hero"
    });
  });
});
