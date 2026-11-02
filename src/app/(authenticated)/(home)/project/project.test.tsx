import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createProject } from "@tests/factories/project";
import { mockServer } from "@tests/fixtures/handlers";
import { http, HttpResponse } from "msw";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import Project from "./page";

const searchParamsMock = vi.fn();
const queryClient: QueryClient = getQueryClient();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: searchParamsMock
  }),
  usePathname: () => "",
  useRouter: () => ({
    replace: vi.fn()
  })
}));

const renderProjectPage = () =>
  renderWithProviders(<Project />, { withAppProviders: true, queryClient });

const mockProjectGet = (project: ReturnType<typeof createProject>) => {
  mockServer.use(http.get("**/projects/**", () => HttpResponse.json(project)));
};

const setProjectSearchParams = (project: ReturnType<typeof createProject>) => {
  searchParamsMock.mockImplementation(
    (param: "projectId" | "timelineId") =>
      ({
        projectId: project.id,
        timelineId: project.timelines?.[0].id
      })[param]
  );
};

describe("Project page", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  test(
    "When user arrives on a project with video uploaded, the settings panel is opened",
    { timeout: 15000 },
    async () => {
      const project = createProject();
      setProjectSearchParams(project);
      mockProjectGet(project);

      renderProjectPage();

      const copyButton = await screen.findByRole("button", {
        name: i18n.t("actions.copy_settings.ariaLabel")
      });
      await waitFor(() => {
        expect(copyButton).toBeVisible();
      });
    }
  );

  test(
    "Clicking Render video tab keeps the plain Settings label showing (Render info hidden)",
    { timeout: 15000 },
    async () => {
      const user = userEvent.setup();
      const project = createProject();
      setProjectSearchParams(project);
      mockProjectGet(project);

      renderProjectPage();

      await screen.findByRole("button", {
        name: i18n.t("actions.copy_settings.ariaLabel")
      });

      expect(
        screen.queryByRole("tab", {
          name: i18n.t("titles.settings_view.label")
        })
      ).toBeNull();

      const renderVideoTab = screen.getByRole("tab", {
        name: i18n.t("titles.render_video.label")
      });
      await user.click(renderVideoTab);

      await waitFor(() => {
        expect(
          screen.getByText(i18n.t("titles.render_settings.label"))
        ).toBeVisible();
      });
      expect(
        screen.queryByRole("tab", {
          name: i18n.t("titles.render_settings.label")
        })
      ).toBeNull();
    }
  );
});
