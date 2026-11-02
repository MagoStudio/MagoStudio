import { describe, expect, test } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { Slider } from "./index";

describe("Slider skeleton state", () => {
  test("sm skeleton exposes no interactive slider", () => {
    const { queryByLabelText } = renderWithProviders(
      <Slider size="sm" skeleton ariaLabel="Brush size" />
    );

    expect(queryByLabelText("Brush size")).toBeNull();
  });

  test("md skeleton exposes no interactive slider", () => {
    const { queryByLabelText } = renderWithProviders(
      <Slider size="md" skeleton ariaLabel="Brush size" />
    );

    expect(queryByLabelText("Brush size")).toBeNull();
  });
});
