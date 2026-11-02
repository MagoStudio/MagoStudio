import { i18n } from "@config/i18n";
import { OnboardingStatus } from "@schemas/balance";
import {
  INITIAL_ONBOARDING_PROGRESS,
  onboardingProgressAtom
} from "@store/atoms/onboardingAtom";
import { screen, waitFor } from "@testing-library/react";
import { createBalance } from "@tests/factories/balance";
import { createProjectListData } from "@tests/factories/projectList";
import { mockServer } from "@tests/fixtures/handlers";
import { getDefaultStore } from "jotai";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { OnboardingFlow } from "./OnboardingFlow";

const clerk = vi.hoisted(() => ({
  unsafeMetadata: {} as Record<string, unknown>
}));

vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({
    user: {
      unsafeMetadata: clerk.unsafeMetadata,
      emailAddresses: [{ emailAddress: "user@example.com" }]
    },
    isLoaded: true
  }),
  useAuth: () => ({ getToken: () => "token" })
}));

vi.mock("@config/featureFlags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@config/featureFlags")>();
  return {
    featureFlags: { ...actual.featureFlags, IS_ONBOARDING_ENABLED: true }
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/onboarding",
  useSearchParams: () => new URLSearchParams()
}));

const newUserOnboarding: OnboardingStatus = {
  img2img_success: 0,
  video_success: 0,
  img2img_remaining: 4,
  video_remaining: 1,
  completed: false
};

const store = getDefaultStore();

beforeEach(() => {
  clerk.unsafeMetadata = {};
  store.set(onboardingProgressAtom, INITIAL_ONBOARDING_PROGRESS);
  mockServer.use(
    http.get("**/balance", () =>
      HttpResponse.json(createBalance({ onboarding: newUserOnboarding }))
    ),
    http.get("**/projects/homepage/list", () =>
      HttpResponse.json(createProjectListData(0))
    ),
    http.get("**/queue", () => HttpResponse.json([]))
  );
});

describe("OnboardingFlow", () => {
  test("a new user who has not completed the questionnaire sees it as the first step", async () => {
    renderWithProviders(<OnboardingFlow />);

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", {
            name: i18n.t("titles.onboarding_questionnaire.name.title")
          })
        ).toBeVisible();
      },
      { timeout: 5000 }
    );
  });

  test("a new user with the completion flag set skips the questionnaire to the upload step", async () => {
    clerk.unsafeMetadata = { signupQuestionnaireCompleted: true };

    renderWithProviders(<OnboardingFlow />);

    await waitFor(
      () => {
        expect(
          screen.getByText(i18n.t("titles.onboarding_upload.label"))
        ).toBeVisible();
      },
      { timeout: 5000 }
    );
    expect(
      screen.queryByRole("heading", {
        name: i18n.t("titles.onboarding_questionnaire.name.title")
      })
    ).toBeNull();
  });
});
