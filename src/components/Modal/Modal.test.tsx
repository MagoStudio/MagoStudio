import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { Modal } from "./index";

describe("Modal entrance animation", () => {
  test("enterAnimation applies the fade-slide entrance class to the surface", () => {
    renderWithProviders(
      <Modal open enterAnimation onClose={vi.fn()} title="Animated" />
    );

    expect(
      document.body.querySelector(".animate-fade-slide-in")
    ).not.toBeNull();
  });

  test("no entrance class without enterAnimation", () => {
    renderWithProviders(<Modal open onClose={vi.fn()} title="Plain" />);

    expect(document.body.querySelector(".animate-fade-slide-in")).toBeNull();
  });

  test("entrance motion preserves the soft lock (no close button, ESC blocked)", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal
        open
        enterAnimation
        preventOutsideClick
        showCloseButton={false}
        onClose={onClose}
        title="Blocking"
      />
    );

    expect(screen.queryByLabelText("Close")).toBeNull();
    expect(
      document.body.querySelector(".animate-fade-slide-in")
    ).not.toBeNull();

    await userEvent.keyboard("{Escape}");
    const backdrop = document.body.querySelector(
      '[data-testid="modal-backdrop"]'
    );
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("a dismissable modal still closes on ESC and outside click (guard is what blocks, not the animation)", async () => {
    const onCloseEsc = vi.fn();
    const { unmount } = renderWithProviders(
      <Modal open enterAnimation onClose={onCloseEsc} title="Dismissable" />
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onCloseEsc).toHaveBeenCalled());
    unmount();

    const onCloseClick = vi.fn();
    renderWithProviders(
      <Modal open enterAnimation onClose={onCloseClick} title="Dismissable" />
    );
    const backdrop = document.body.querySelector(
      '[data-testid="modal-backdrop"]'
    );
    await userEvent.click(backdrop as Element);
    await waitFor(() => expect(onCloseClick).toHaveBeenCalled());
  });

  test("pointer interaction can move focus between modal inputs", async () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()} title="Interactive">
        <input aria-label="API key" />
        <input aria-label="PIN" />
      </Modal>
    );

    const apiKey = screen.getByLabelText("API key");
    const pin = screen.getByLabelText("PIN");
    await userEvent.click(apiKey);
    expect(apiKey).toHaveFocus();
    await userEvent.type(apiKey, "key-value");
    expect(apiKey).toHaveValue("key-value");

    await userEvent.click(pin);
    expect(pin).toHaveFocus();
    await userEvent.type(pin, "123456");
    expect(pin).toHaveValue("123456");
  });
});
