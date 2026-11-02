import {
  OnboardingProgress,
  onboardingProgressAtom
} from "@store/atoms/onboardingAtom";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useIsOnboardingActive } from "./useIsOnboardingActive";

const nav = vi.hoisted(() => ({
  pathname: "/onboarding",
  params: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params
}));

const completed = vi.hoisted(() => ({ value: false }));
vi.mock("./useIsOnboardingCompleted", () => ({
  useIsOnboardingCompleted: () => completed.value
}));

const baseProgress: OnboardingProgress = { step: "upload" };

const renderActive = (
  pathname: string,
  search: string,
  progress: Partial<OnboardingProgress> = {}
) => {
  nav.pathname = pathname;
  nav.params = new URLSearchParams(search);
  const store = createStore();
  store.set(onboardingProgressAtom, { ...baseProgress, ...progress });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useIsOnboardingActive(), { wrapper }).result.current;
};

describe("useIsOnboardingActive", () => {
  beforeEach(() => {
    completed.value = false;
  });

  test("true on the /onboarding route", () => {
    expect(renderActive("/onboarding", "", { step: "upload" })).toBe(true);
  });

  test("true on /project with the onboarding param", () => {
    expect(
      renderActive("/project", "onboarding=1", { step: "generate-image" })
    ).toBe(true);
  });

  test("true on /project mid-creative-step even without the param", () => {
    expect(renderActive("/project", "", { step: "generate-image" })).toBe(true);
  });

  test("false on /project with an entry step and no param", () => {
    expect(renderActive("/project", "", { step: "upload" })).toBe(false);
  });

  test("false once onboarding is complete, even on the route", () => {
    expect(renderActive("/onboarding", "", { step: "complete" })).toBe(false);
  });

  test("false on an unrelated page", () => {
    expect(renderActive("/", "", { step: "upload" })).toBe(false);
  });

  describe("completion release", () => {
    test("false once complete, even on the route", () => {
      completed.value = true;
      expect(renderActive("/onboarding", "", { step: "complete" })).toBe(false);
    });

    test("releases an earlier project step when completion flips", () => {
      completed.value = true;
      expect(
        renderActive("/project", "onboarding=1", { step: "generate-image" })
      ).toBe(false);
    });

    test("releases the render step before submission when completion flips", () => {
      completed.value = true;
      expect(
        renderActive("/project", "onboarding=1", {
          step: "render",
          renderSubmitted: false
        })
      ).toBe(false);
    });

    test("holds the render-done confirmation when completion flips", () => {
      completed.value = true;
      expect(
        renderActive("/project", "onboarding=1", {
          step: "render",
          renderSubmitted: true
        })
      ).toBe(true);
    });

    test("releases onboarding at the tutorial step so the normal app shows behind the card", () => {
      expect(
        renderActive("/project", "onboarding=1", { step: "tutorial" })
      ).toBe(false);
    });

    test("releases once the tutorial is dismissed (step complete on the project page)", () => {
      completed.value = true;
      expect(
        renderActive("/project", "onboarding=1", { step: "complete" })
      ).toBe(false);
    });
  });
});
