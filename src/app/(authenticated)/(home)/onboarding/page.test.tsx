import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  })
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@home/components/onboarding/OnboardingFlow", () => ({
  OnboardingFlow: () => <div data-testid="onboarding-flow" />
}));

import OnboardingPage from "./page";

const stubAccountMode = (mode: "cloud" | "offline") =>
  vi.stubGlobal("mago", { account: { mode } });

describe("OnboardingPage in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends a user with no cloud account home instead of starting from a cloud template", () => {
    stubAccountMode("offline");

    expect(() => render(<OnboardingPage />)).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
    expect(screen.queryByTestId("onboarding-flow")).toBeNull();
  });

  it("shows onboarding to a signed-in user", () => {
    stubAccountMode("cloud");

    render(<OnboardingPage />);

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("onboarding-flow")).toBeInTheDocument();
  });
});
