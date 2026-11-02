import {
  INITIAL_ONBOARDING_PROGRESS,
  onboardingProgressAtom
} from "@store/atoms/onboardingAtom";
import { toastNotificationsAtom } from "@store/atoms/toastAtom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getDefaultStore } from "jotai";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { OnboardingQuestionnaireStep } from "./OnboardingQuestionnaireStep";

const clerk = vi.hoisted(() => {
  const update = vi.fn<(params: unknown) => Promise<void>>();
  const updateMetadata = vi.fn<(params: unknown) => Promise<void>>();
  const user = {
    firstName: null as string | null,
    lastName: null as string | null,
    unsafeMetadata: {} as Record<string, unknown>,
    update,
    updateMetadata
  };
  return { update, updateMetadata, user, isLoaded: true };
});

vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({ user: clerk.user, isLoaded: clerk.isLoaded })
}));

const store = getDefaultStore();

beforeEach(() => {
  clerk.update.mockReset();
  clerk.update.mockResolvedValue(undefined);
  clerk.updateMetadata.mockReset();
  clerk.updateMetadata.mockResolvedValue(undefined);
  clerk.user.firstName = null;
  clerk.user.lastName = null;
  clerk.user.unsafeMetadata = {};
  clerk.isLoaded = true;
  store.set(onboardingProgressAtom, INITIAL_ONBOARDING_PROGRESS);
  store.set(toastNotificationsAtom, []);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fillName = async (
  user: ReturnType<typeof userEvent.setup>,
  first: string,
  last: string
) => {
  await user.type(screen.getByRole("textbox", { name: "First name" }), first);
  await user.type(screen.getByRole("textbox", { name: "Last name" }), last);
};

const completeName = async (user: ReturnType<typeof userEvent.setup>) => {
  await fillName(user, "Ada", "Lovelace");
  await user.click(screen.getByRole("button", { name: "Continue" }));
};

describe("OnboardingQuestionnaireStep", () => {
  test("prefills the name inputs from the Clerk user", () => {
    clerk.user.firstName = "Grace";
    clerk.user.lastName = "Hopper";

    renderWithProviders(<OnboardingQuestionnaireStep />);

    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue(
      "Grace"
    );
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue(
      "Hopper"
    );
  });

  test("keeps Continue disabled until both names contain non-whitespace text", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "First name" }), "Ada");
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "Last name" }), "   ");
    expect(continueButton).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: "Last name" }),
      "Lovelace"
    );
    expect(continueButton).toBeEnabled();
  });

  test("advances name -> line of work -> how heard and persists to Clerk", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);

    expect(
      screen.getByRole("heading", { name: "What is your line of work?" })
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "VFX" }));

    expect(
      screen.getByRole("heading", { name: "How did you hear about Mago?" })
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Instagram" }));

    expect(clerk.updateMetadata).toHaveBeenCalledTimes(1);
    expect(clerk.updateMetadata).toHaveBeenCalledWith({
      unsafeMetadata: {
        profession: "vfx",
        referralSource: "instagram",
        signupQuestionnaireCompleted: true
      }
    });
    expect(clerk.update).toHaveBeenCalledWith({
      firstName: "Ada",
      lastName: "Lovelace"
    });
    expect(store.get(onboardingProgressAtom).step).toBe("upload");
  });

  test("sends only its own keys so Clerk deep-merge preserves the rest", async () => {
    clerk.user.unsafeMetadata = { referral_id: "aff-1" };
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);
    await user.click(screen.getByRole("button", { name: "2D animation" }));
    await user.click(screen.getByRole("button", { name: "Youtube" }));

    expect(clerk.updateMetadata).toHaveBeenCalledWith({
      unsafeMetadata: {
        profession: "2d_animation",
        referralSource: "youtube",
        signupQuestionnaireCompleted: true
      }
    });
    const [[metadataArg]] = clerk.updateMetadata.mock.calls as [
      [{ unsafeMetadata: Record<string, unknown> }]
    ];
    expect(metadataArg.unsafeMetadata).not.toHaveProperty("referral_id");
  });

  test("the questionnaire has no Back button (forward-only)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "VFX" }));
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  test("a failed save keeps the user on the questionnaire and shows a toast", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    clerk.update.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);
    await user.click(screen.getByRole("button", { name: "VFX" }));
    await user.click(screen.getByRole("button", { name: "Instagram" }));

    expect(store.get(onboardingProgressAtom).step).toBe("questionnaire");
    expect(store.get(toastNotificationsAtom)).toHaveLength(1);
  });

  test("renders every line-of-work and how-heard option", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);

    for (const label of [
      "2D animation",
      "3D animation",
      "VFX",
      "Vertical Drama",
      "Social media content",
      "Other"
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeVisible();
    }

    await user.click(screen.getByRole("button", { name: "VFX" }));

    for (const label of [
      "Instagram",
      "Youtube",
      "Linkedin",
      "Google",
      "From a friend",
      "Tiktok"
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("'Other' reveals an autofocused free-text input with a disabled Continue until typed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);

    expect(screen.queryByRole("textbox")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Other" }));

    const input = screen.getByRole("textbox", { name: "Tell us what you do" });
    expect(input).toBeVisible();
    expect(input).toHaveFocus();

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.type(input, "   ");
    expect(continueButton).toBeDisabled();

    await user.type(input, "Puppeteer");
    expect(continueButton).toBeEnabled();
  });

  test("submitting the free-text 'Other' persists profession=other plus the typed professionOther", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await completeName(user);
    await user.click(screen.getByRole("button", { name: "Other" }));
    await user.type(
      screen.getByRole("textbox", { name: "Tell us what you do" }),
      "Puppeteer"
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "How did you hear about Mago?" })
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Instagram" }));

    expect(clerk.updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        unsafeMetadata: expect.objectContaining({
          profession: "other",
          professionOther: "Puppeteer"
        })
      })
    );
  });

  test("trims whitespace-padded names in the persisted payload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingQuestionnaireStep />);

    await fillName(user, "  Ada  ", "  Lovelace  ");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "VFX" }));
    await user.click(screen.getByRole("button", { name: "Instagram" }));

    expect(clerk.update).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Ada", lastName: "Lovelace" })
    );
  });

  test("renders nothing until the Clerk user is loaded", () => {
    clerk.isLoaded = false;

    const { container } = renderWithProviders(<OnboardingQuestionnaireStep />);

    expect(container).toBeEmptyDOMElement();
  });
});
