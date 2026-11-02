import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { UploadError } from "./index";

describe("UploadError", () => {
  it("invokes onClearFileName when the close button is pressed in compact mode", async () => {
    const user = userEvent.setup();
    const onClearFileName = vi.fn();

    render(
      <UploadError
        fileName="oversize.png"
        uploadError="Image is too big"
        onClearFileName={onClearFileName}
        compact
      />
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClearFileName).toHaveBeenCalledTimes(1);
  });

  it("invokes onClearFileName when the close button is pressed in default mode with a fileName", async () => {
    const user = userEvent.setup();
    const onClearFileName = vi.fn();

    render(
      <UploadError
        fileName="oversize.png"
        uploadError="Image is too big"
        onClearFileName={onClearFileName}
      />
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClearFileName).toHaveBeenCalledTimes(1);
  });

  it.each([
    { mode: "compact" as const, compact: true },
    { mode: "default" as const, compact: false }
  ])(
    "invokes onClearFileName when activated via keyboard in $mode mode (react-aria onPress path)",
    async ({ compact }) => {
      const user = userEvent.setup();
      const onClearFileName = vi.fn();

      render(
        <UploadError
          fileName="oversize.png"
          uploadError="Image is too big"
          onClearFileName={onClearFileName}
          compact={compact}
        />
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      closeButton.focus();
      await user.keyboard("{Enter}");

      expect(onClearFileName).toHaveBeenCalledTimes(1);
    }
  );
});
