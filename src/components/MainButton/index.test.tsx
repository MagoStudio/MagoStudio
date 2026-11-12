import { fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { MainButton } from "./index";

describe("MainButton loading vs disabled semantics", () => {
  test("a loading-only button stays focusable and aria-disabled, not natively disabled", () => {
    const { getByRole } = renderWithProviders(
      <MainButton loading>Go</MainButton>
    );
    const button = getByRole("button");

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    expect(button.tabIndex).toBe(0);
  });

  test("a truly disabled button is natively disabled, with no data-loading", () => {
    const { getByRole } = renderWithProviders(
      <MainButton isDisabled>Go</MainButton>
    );
    const button = getByRole("button");

    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("data-loading");
  });

  test("pressing a loading-only button calls neither onPress nor onDisabledPress", () => {
    const onPress = vi.fn();
    const onDisabledPress = vi.fn();
    const { getByRole } = renderWithProviders(
      <MainButton loading onPress={onPress} onDisabledPress={onDisabledPress}>
        Go
      </MainButton>
    );

    fireEvent.click(getByRole("button"));

    expect(onPress).not.toHaveBeenCalled();
    expect(onDisabledPress).not.toHaveBeenCalled();
  });

  test("onDisabledPress still fires for a genuinely disabled button", () => {
    const onDisabledPress = vi.fn();
    const { getByRole } = renderWithProviders(
      <MainButton isDisabled onDisabledPress={onDisabledPress}>
        Go
      </MainButton>
    );

    fireEvent.click(getByRole("button"));

    expect(onDisabledPress).toHaveBeenCalledTimes(1);
  });

  test("renders type=button while loading even when submit was requested, so it cannot become a form's implicit submit button", () => {
    const { getByRole } = renderWithProviders(
      <MainButton type="submit" loading>
        Go
      </MainButton>
    );

    expect(getByRole("button")).toHaveAttribute("type", "button");
  });

  test("keeps the requested type once no longer loading", () => {
    const { getByRole } = renderWithProviders(
      <MainButton type="submit">Go</MainButton>
    );

    expect(getByRole("button")).toHaveAttribute("type", "submit");
  });

  test("prevents native Enter/Space activation while loading, without going natively disabled", () => {
    const { getByRole } = renderWithProviders(
      <MainButton type="submit" loading>
        Go
      </MainButton>
    );
    const button = getByRole("button");

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(enterEvent);
    expect(enterEvent.defaultPrevented).toBe(true);

    const spaceEvent = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(spaceEvent);
    expect(spaceEvent.defaultPrevented).toBe(true);

    expect(button).not.toBeDisabled();
  });

  test("does not suppress native Enter activation once no longer loading", () => {
    const { getByRole } = renderWithProviders(
      <MainButton type="submit">Go</MainButton>
    );
    const button = getByRole("button");

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(false);
  });

  test("prevents native Enter activation for an intercepting disabled press, the same aria-disabled-without-native-disable case", () => {
    const { getByRole } = renderWithProviders(
      <MainButton isDisabled onDisabledPress={() => {}}>
        Go
      </MainButton>
    );
    const button = getByRole("button");

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
  });
});

describe("MainButton spinner colour", () => {
  test("renders the loading spinner in glyph-primary-on-pic, not the grey default", () => {
    const { getByRole } = renderWithProviders(
      <MainButton loading>Go</MainButton>
    );
    const spinner = getByRole("progressbar");

    expect(spinner.innerHTML).toContain("fill-glyph-primary-on-pic");
    expect(spinner.innerHTML).not.toContain("fill-glyph-secondary");
  });
});

describe("MainButton solid danger colour scheme", () => {
  test("renders the default state background/text tokens and no border", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="danger">Cancel bulk rendering</MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("bg-element-error");
    expect(classList).toContain("text-glyph-primary-on-pic");
    expect(
      classList.some(
        (className) => className === "border" || className.startsWith("border-")
      )
    ).toBe(false);
  });

  test("renders the hover background token", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="danger">Cancel bulk rendering</MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[hovered]:bg-glyph-error-hover");
  });

  test("forces the default background back on press over the hover fill", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="danger">Cancel bulk rendering</MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[pressed]:!bg-element-error");
  });

  test("carries the Progress token as a plain data-[loading] rule, stays focusable, no forced override needed", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="danger" loading>
        Cancel bulk rendering
      </MainButton>
    );
    const button = getByRole("button");
    const classList = button.className.split(" ");

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("data-loading", "true");
    expect(classList).toContain("data-[loading]:bg-glyph-error-hover");
    expect(classList.some((className) => className.startsWith("!"))).toBe(
      false
    );
  });

  test("renders a border and a transparent background when disabled", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="danger" isDisabled>
        Cancel bulk rendering
      </MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[disabled]:border");
    expect(classList).toContain("data-[disabled]:border-glyph-disabled");
    expect(classList).toContain("data-[disabled]:bg-transparent");
    expect(classList).toContain("data-[disabled]:text-glyph-disabled");
  });
});

describe("MainButton Progress token per colour scheme, from the Design System", () => {
  test("primary matches Main/M Progress: element-tertiary", () => {
    const { getByRole } = renderWithProviders(
      <MainButton loading>Go</MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[loading]:bg-element-tertiary");
  });

  test("secondary matches Secondary/M Progress: element-primary-active", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="secondary" loading>
        Go
      </MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[loading]:bg-element-primary-active");
  });

  test("outlined onColor matches On Color/S Progress: glyph-secondary border and text", () => {
    const { getByRole } = renderWithProviders(
      <MainButton variant="outlined" colorScheme="onColor" loading>
        Go
      </MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[loading]:border-glyph-secondary");
    expect(classList).toContain("data-[loading]:text-glyph-secondary");
  });

  test("gradient has no DS-defined Progress variant, so it carries no loading override", () => {
    const { getByRole } = renderWithProviders(
      <MainButton colorScheme="gradient" loading>
        Go
      </MainButton>
    );
    const button = getByRole("button");
    const classList = button.className.split(" ");

    expect(
      classList.some((className) => className.includes("data-[loading]"))
    ).toBe(false);
    expect(classList).toContain("bg-gradient-100");
    expect(button).not.toBeDisabled();
  });

  test("outlined danger has no Design System entry, so it keeps its resting red look while loading instead of looking disabled", () => {
    const { getByRole } = renderWithProviders(
      <MainButton variant="outlined" colorScheme="danger" loading>
        Cancel
      </MainButton>
    );
    const button = getByRole("button");
    const classList = button.className.split(" ");

    expect(
      classList.some((className) => className.includes("data-[loading]"))
    ).toBe(false);
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});

describe("MainButton outlined danger colour scheme is unaffected", () => {
  test("keeps the outlined border-only look", () => {
    const { getByRole } = renderWithProviders(
      <MainButton variant="outlined" colorScheme="danger">
        Delete
      </MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("border");
    expect(classList).toContain("border-glyph-error");
    expect(classList).toContain("text-glyph-error");
    expect(classList).toContain("bg-transparent");
    expect(classList).not.toContain("bg-element-error");
    expect(classList).not.toContain("text-glyph-primary-on-pic");
  });

  test("keeps the outlined hover tokens", () => {
    const { getByRole } = renderWithProviders(
      <MainButton variant="outlined" colorScheme="danger">
        Delete
      </MainButton>
    );
    const classList = getByRole("button").className.split(" ");

    expect(classList).toContain("data-[hovered]:border-glyph-error-hover");
    expect(classList).toContain("data-[hovered]:text-glyph-error-hover");
    expect(classList).not.toContain("data-[hovered]:bg-glyph-error-hover");
  });
});

describe("MainButton keyboard events", () => {
  test("lets Escape bubble to an enclosing popover or dialog", () => {
    const onParentKeyDown = vi.fn();
    const { getByRole } = renderWithProviders(
      <div onKeyDown={(event) => onParentKeyDown(event.key)}>
        <MainButton>Go</MainButton>
      </div>
    );
    fireEvent.keyDown(getByRole("button"), { key: "Escape" });
    expect(onParentKeyDown).toHaveBeenCalledWith("Escape");
  });
});
