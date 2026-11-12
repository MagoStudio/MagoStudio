import { Modal } from "@components/Modal";
import { i18n } from "@config/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { createModelSettingsFixture } from "@/stories/fixtures/createModelSettingsFixture";

import { ModelComponentSelect } from "./ModelComponentSelect";
import { ModelTypeSelect } from "./ModelTypeSelect";

it.each(["model", "component"])(
  "keeps settings open when double-clicking a %s option",
  async (kind) => {
    await i18n.changeLanguage("en");
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "minimax"
    });
    const onClose = vi.fn();
    const onChange = vi.fn();
    render(
      <Modal open onClose={onClose} title="Local settings">
        {kind === "model" ? (
          <ModelTypeSelect
            value="minimax"
            onChange={onChange}
            disabled={false}
            snapshots={[snapshot]}
          />
        ) : (
          <ModelComponentSelect
            value="main"
            onChange={onChange}
            disabled={false}
            components={snapshot.components}
          />
        )}
      </Modal>
    );
    const user = userEvent.setup();
    const modal = screen.getByRole("dialog");
    await user.click(
      screen.getByRole("button", {
        name: kind === "model" ? /Model type/ : /Component/
      })
    );
    const option = screen.getAllByRole("option")[kind === "model" ? 0 : 1];
    expect(modal).toContainElement(option);
    await user.dblClick(option);
    expect(onChange).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  }
);
