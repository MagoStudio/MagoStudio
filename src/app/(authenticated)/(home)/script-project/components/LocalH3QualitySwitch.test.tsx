import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  LocalH3QualitySwitch,
  resolveLocalH3QualitySteps
} from "./LocalH3QualitySwitch";

describe("LocalH3QualitySwitch", () => {
  test("offers Slow as 8 steps and Fast as 4", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <LocalH3QualitySwitch steps={4} isDisabled={false} onChange={onChange} />
    );

    fireEvent.click(within(getByTestId("radio-pill-slow")).getByRole("radio"));

    expect(onChange).toHaveBeenCalledWith(8);
  });

  test("reads a 3-step setting from before the switch as Fast", () => {
    expect(resolveLocalH3QualitySteps(3)).toBe(4);
    expect(resolveLocalH3QualitySteps(8)).toBe(8);
  });
});
