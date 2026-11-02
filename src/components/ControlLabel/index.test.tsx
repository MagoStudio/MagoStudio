import { describe, expect, test } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ControlLabel } from "./index";

describe("ControlLabel", () => {
  test("renders no info icon without a tooltip", () => {
    const { container, getByText } = renderWithProviders(
      <ControlLabel label="Strength" />
    );

    expect(getByText("Strength")).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="control-label-info-trigger"]')
    ).not.toBeInTheDocument();
  });

  test("renders the info icon after the label text when a tooltip is provided", () => {
    const { container, getByText } = renderWithProviders(
      <ControlLabel label="Strength" tooltip="Controls the effect strength" />
    );

    const label = getByText("Strength");
    const icon = container.querySelector(
      '[data-testid="control-label-info-trigger"]'
    );

    expect(icon).toBeInTheDocument();
    expect(
      label.compareDocumentPosition(icon!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test("renders no info icon when label is empty even with a tooltip", () => {
    const { container } = renderWithProviders(
      <ControlLabel tooltip="Controls the effect strength" />
    );

    expect(
      container.querySelector('[data-testid="control-label-info-trigger"]')
    ).not.toBeInTheDocument();
  });
});
