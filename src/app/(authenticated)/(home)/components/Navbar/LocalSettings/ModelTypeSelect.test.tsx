import { i18n } from "@config/i18n";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { createModelSettingsFixture } from "@/stories/fixtures/createModelSettingsFixture";

import { ModelTypeSelect } from "./ModelTypeSelect";

it("updates cached dropdown rows when component status changes without a reload", async () => {
  await i18n.changeLanguage("en");
  const ready = await createModelSettingsFixture().api.inspect({
    model: "minimax"
  });
  const broken = structuredClone(ready);
  broken.components[0].problem = { status: "error", message: "Load failed" };
  const props = {
    value: "minimax" as const,
    onChange: vi.fn(),
    disabled: false
  };
  const { rerender } = render(
    <ModelTypeSelect {...props} snapshots={[broken]} />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Model type/ }));
  const errorLabel = i18n.t("localSettings.statusMark.needsAttention", {
    label: "MiniMax H3"
  });
  const readyLabel = i18n.t("localSettings.statusMark.ready", {
    label: "MiniMax H3"
  });
  expect(
    within(screen.getByRole("option", { name: /^MiniMax H3/ })).getByLabelText(
      errorLabel
    )
  ).toBeInTheDocument();
  rerender(<ModelTypeSelect {...props} snapshots={[ready]} />);
  expect(
    within(screen.getByRole("option", { name: /^MiniMax H3/ })).getByLabelText(
      readyLabel
    )
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("option", { name: /^MiniMax H3/ })
    ).queryByLabelText(errorLabel)
  ).not.toBeInTheDocument();
  rerender(<ModelTypeSelect {...props} snapshots={[broken]} />);
  expect(
    within(screen.getByRole("option", { name: /^MiniMax H3/ })).getByLabelText(
      errorLabel
    )
  ).toBeInTheDocument();
});
