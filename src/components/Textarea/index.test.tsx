import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { Textarea } from "./index";

describe("Textarea skeleton state", () => {
  test("exposes no textbox while the placeholder shimmer is showing", () => {
    const { queryByRole } = renderWithProviders(
      <Textarea skeleton aria-label="Prompt" />
    );

    expect(queryByRole("textbox")).toBeNull();
  });
});

describe("Textarea hint placeholder", () => {
  test("typed content reaches the value while the hint stays the placeholder, not a separate element", async () => {
    const user = userEvent.setup();
    const { getByRole, container } = renderWithProviders(
      <Textarea placeholder="Write your prompt here" aria-label="Prompt" />
    );
    const textarea = getByRole("textbox") as HTMLTextAreaElement;

    await user.type(textarea, "A rendered prompt");

    expect(textarea.value).toBe("A rendered prompt");
    expect(textarea.placeholder).toBe("Write your prompt here");
    expect(container.querySelector('[data-testid="textarea-hint"]')).toBeNull();
  });
});

describe("Textarea automatic sizing", () => {
  test("matches the content height on the initial render", () => {
    vi.spyOn(
      HTMLTextAreaElement.prototype,
      "scrollHeight",
      "get"
    ).mockReturnValue(96);
    const { getByRole } = renderWithProviders(
      <Textarea
        autoResize
        value={"Line one\nLine two"}
        readOnly
        aria-label="Prompt"
      />
    );

    expect((getByRole("textbox") as HTMLTextAreaElement).style.height).toBe(
      "96px"
    );
  });
});
