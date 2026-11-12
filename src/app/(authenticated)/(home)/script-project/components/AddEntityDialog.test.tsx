import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { AddEntityDialog } from "./AddEntityDialog";

describe("AddEntityDialog", () => {
  it("shows the new-entity form and discards the draft when closed", () => {
    const onDiscard = vi.fn();
    const screen = renderWithProviders(
      <AddEntityDialog
        draft={{
          draftId: "draft",
          name: "",
          kind: "character",
          prompt: "",
          referenceAssetIds: [],
          referenceInstruction: ""
        }}
        existingTokens={[]}
        isBusy={false}
        isBusyWithAnythingButImageUploads={false}
        onChange={vi.fn()}
        onRender={vi.fn()}
        onUploadImage={vi.fn()}
        onUploadReference={vi.fn()}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByTestId("draft-sheet-group-name-draft")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onDiscard).toHaveBeenCalled();
  });
});
