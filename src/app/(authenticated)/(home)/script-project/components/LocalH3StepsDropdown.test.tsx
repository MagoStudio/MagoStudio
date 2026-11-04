import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { LocalH3StepsDropdown } from "./LocalH3StepsDropdown";

const openDropdown = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(
    within(screen.getByTestId("script-project-local-h3-steps")).getByRole(
      "button"
    )
  );

describe("LocalH3StepsDropdown", () => {
  test("marks every step LoRA that is not installed", async () => {
    const user = userEvent.setup();
    render(
      <LocalH3StepsDropdown
        steps={8}
        isDisabled={false}
        isStepLoraInstalled={(steps) => steps === 8}
        onChange={vi.fn()}
      />
    );

    await openDropdown(user);

    expect(
      within(
        screen.getByRole("option", {
          name: /local_h3_steps_2.label/
        })
      ).getByText("script_project.local_h3_steps_not_installed.label")
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("option", {
          name: /local_h3_steps_4.label/
        })
      ).getByText("script_project.local_h3_steps_not_installed.label")
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("option", {
          name: /local_h3_steps_8.label/
        })
      ).queryByText("script_project.local_h3_steps_not_installed.label")
    ).not.toBeInTheDocument();
  });

  test("still lets the user pick a step LoRA that is not installed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LocalH3StepsDropdown
        steps={8}
        isDisabled={false}
        isStepLoraInstalled={(steps) => steps === 8}
        onChange={onChange}
      />
    );

    await openDropdown(user);
    await user.click(
      screen.getByRole("option", {
        name: /local_h3_steps_4.label/
      })
    );

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
