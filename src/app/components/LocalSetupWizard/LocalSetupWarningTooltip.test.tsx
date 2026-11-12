import { OverlayDialog } from "@components/OverlayDialog";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocalSetupWarningTooltip } from "./LocalSetupWarningTooltip";

describe("LocalSetupWarningTooltip", () => {
  it("keeps a dialog's setup action outside React Aria's inert boundary", () => {
    const onAction = vi.fn();
    render(
      <OverlayDialog
        isOpen
        onOpenChange={vi.fn()}
        size={{ mode: "hug", maxWidthPx: 640 }}
      >
        <LocalSetupWarningTooltip
          placement="bottom"
          message="Finish setup"
          actionLabel="Set up local render"
          onAction={onAction}
        >
          <button type="button" disabled>
            Create local project
          </button>
        </LocalSetupWarningTooltip>
      </OverlayDialog>
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("data-react-aria-top-layer", "true");
    expect(tooltip).toHaveClass("data-[react-aria-top-layer=true]:z-tooltip");
    fireEvent.click(
      screen.getByRole("button", { name: "Set up local render" })
    );
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("shows the message and runs the action from its button", () => {
    const onAction = vi.fn();
    render(
      <LocalSetupWarningTooltip
        placement="bottom"
        message="This model isn't installed yet."
        actionLabel="Update installation"
        onAction={onAction}
      >
        <button type="button" disabled>
          Generate
        </button>
      </LocalSetupWarningTooltip>
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This model isn't installed yet."
    );
    expect(screen.getByRole("tooltip")).not.toHaveAttribute(
      "data-react-aria-top-layer"
    );
    expect(screen.getByRole("tooltip")).toHaveClass("z-page-popover");
    expect(screen.getByRole("tooltip")).not.toHaveClass("z-tooltip");
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Update installation" })
    );
    expect(onAction).toHaveBeenCalledOnce();
  });
});
