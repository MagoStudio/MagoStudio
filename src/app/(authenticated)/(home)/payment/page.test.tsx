import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { expect, test, vi, describe, beforeEach } from "vitest";

import PaymentPage from "./page";

const mockSearchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));

const TestedComponent = () => {
  const queryClient = getQueryClient();

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <PaymentPage />
      </QueryClientProvider>
    </I18nextProvider>
  );
};

describe("Payment Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("displays Credits tab when ?tab=credits is in URL", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "tab" ? "credits" : null
    );

    render(<TestedComponent />);

    await waitFor(() => {
      const creditsTab = screen.getByRole("tab", {
        name: i18n.t("titles.credits.label")
      });
      expect(creditsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test("displays Subscriptions tab by default when no tab param is provided", async () => {
    mockSearchParamsGet.mockImplementation(() => null);

    render(<TestedComponent />);

    await waitFor(() => {
      const subscriptionsTab = screen.getByRole("tab", {
        name: i18n.t("titles.subscriptions.label")
      });
      expect(subscriptionsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test("displays Subscriptions tab when ?tab=subscriptions is in URL", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "tab" ? "subscriptions" : null
    );

    render(<TestedComponent />);

    await waitFor(() => {
      const subscriptionsTab = screen.getByRole("tab", {
        name: i18n.t("titles.subscriptions.label")
      });
      expect(subscriptionsTab).toHaveAttribute("aria-selected", "true");
    });
  });
});
