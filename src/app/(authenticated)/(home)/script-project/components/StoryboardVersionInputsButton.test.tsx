import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { StoryboardVersionInputsButton } from "./StoryboardVersionInputsButton";

describe("StoryboardVersionInputsButton", () => {
  it("shows how many panels the version was drawn with, and no reuse", async () => {
    const screen = renderWithProviders(
      <StoryboardVersionInputsButton
        panelCount={4}
        versionName="Version 1"
        testId="inputs"
      />
    );
    fireEvent.click(screen.getByTestId("inputs"));
    expect(await screen.findByText("4 panels")).toBeVisible();
    expect(screen.queryByRole("button", { name: /settings/u })).toBeNull();
  });
});
