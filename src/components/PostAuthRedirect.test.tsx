import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, useNeedsOnboarding } = vi.hoisted(() => ({
  replace: vi.fn(),
  useNeedsOnboarding: vi.fn()
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@domains/onboarding/useNeedsOnboarding", () => ({
  useNeedsOnboarding
}));

import { ROUTES } from "@config/constants";

import { PostAuthRedirect } from "./PostAuthRedirect";

const LONG_AGO_MS = 0;

describe("PostAuthRedirect in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("never asks a user with no cloud account about onboarding and sends them home", async () => {
    vi.stubGlobal("mago", { account: { mode: "offline" } });
    useNeedsOnboarding.mockReturnValue({
      needsOnboarding: undefined,
      isLoading: false
    });

    render(<PostAuthRedirect readyToNavigate mountedAtMs={LONG_AGO_MS} />);

    expect(useNeedsOnboarding).toHaveBeenCalledWith(false);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(replace).not.toHaveBeenCalledWith(ROUTES.ONBOARDING);
  });

  it("sends a signed-in user who needs onboarding to onboarding", async () => {
    vi.stubGlobal("mago", { account: { mode: "cloud" } });
    useNeedsOnboarding.mockReturnValue({
      needsOnboarding: true,
      isLoading: false
    });

    render(<PostAuthRedirect readyToNavigate mountedAtMs={LONG_AGO_MS} />);

    expect(useNeedsOnboarding).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(ROUTES.ONBOARDING)
    );
  });
});
