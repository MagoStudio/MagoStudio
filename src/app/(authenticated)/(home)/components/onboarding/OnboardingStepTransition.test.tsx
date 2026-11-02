import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { OnboardingStepTransition } from "./OnboardingStepTransition";

describe("OnboardingStepTransition", () => {
  test("renders a single entering layer on first mount", () => {
    const { container } = render(
      <OnboardingStepTransition transitionKey="upload">
        <div data-testid="upload">Upload</div>
      </OnboardingStepTransition>
    );

    expect(container.querySelectorAll(".animate-fade-slide-in")).toHaveLength(
      1
    );
    expect(container.querySelector(".animate-fade-out")).toBeNull();
  });

  test("on a swap the entering and exiting layers co-exist with the right motion classes", () => {
    const { container, rerender } = render(
      <OnboardingStepTransition transitionKey="upload">
        <div data-testid="upload">Upload</div>
      </OnboardingStepTransition>
    );

    rerender(
      <OnboardingStepTransition transitionKey="generate-image">
        <div data-testid="generate-image">Generate</div>
      </OnboardingStepTransition>
    );

    const entering = container.querySelector(".animate-fade-slide-in");
    const exiting = container.querySelector(".animate-fade-out");

    expect(entering).not.toBeNull();
    expect(exiting).not.toBeNull();

    expect(exiting).toHaveClass("absolute");
    expect(exiting?.getAttribute("aria-hidden")).toBe("true");
    expect(entering).not.toHaveClass("absolute");

    expect(exiting?.textContent).toBe("Upload");
    expect(entering?.textContent).toBe("Generate");
  });
});
