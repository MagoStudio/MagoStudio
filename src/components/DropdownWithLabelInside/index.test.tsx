import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DropdownWithLabelInside } from "./index";

const ITEMS = [
  { key: "gpt-image-1", label: "GPT image 1" },
  { key: "gpt-image-2", label: "GPT image 2" }
];

describe("DropdownWithLabelInside", () => {
  test("renders the trigger enabled by default", () => {
    render(
      <DropdownWithLabelInside
        label="Model"
        items={ITEMS}
        selectedKey="gpt-image-2"
      />
    );

    expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
  });

  test("renders a disabled trigger that cannot be opened when isDisabled is set", () => {
    render(
      <DropdownWithLabelInside
        label="Model"
        items={ITEMS}
        selectedKey="gpt-image-2"
        isDisabled
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
