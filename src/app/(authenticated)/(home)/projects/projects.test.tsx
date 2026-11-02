import { CreateProjectDestinationDialogHost } from "@home/components/dashboard/CreateProjectDestinationDialog/CreateProjectDestinationDialogHost";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createProjectListData } from "@tests/factories/projectList";
import { mockServer } from "@tests/fixtures/handlers";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import ProjectsByTypePage from "./page";

const navigation = vi.hoisted(() => ({
  routerPushFn: vi.fn(),
  searchParams: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigation.routerPushFn,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  usePathname: () => "/projects/",
  useSearchParams: () => navigation.searchParams
}));

const renderListPageOfType = (projectType: string) => {
  navigation.searchParams = new URLSearchParams({ type: projectType });
  return renderWithProviders(
    <>
      <ProjectsByTypePage />
      <CreateProjectDestinationDialogHost />
    </>
  );
};

describe("Project list page", () => {
  beforeEach(() => {
    navigation.routerPushFn.mockReset();
    mockServer.use(
      http.get("**/projects/homepage/list", () =>
        HttpResponse.json(createProjectListData(0))
      )
    );
  });

  test("User can create a new Video to Video project from its list page", async () => {
    const user = userEvent.setup();

    const newProject = {
      id: "new-project-id",
      name: "Untitled",
      description: "",
      active: true,
      timelines: [{ id: "shot-1", name: "Untitled", layers: [] }],
      settings: { rangeMin: 0, rangeMax: 99 }
    };

    mockServer.use(
      http.post("**/projects", () => {
        return HttpResponse.json(newProject);
      }),
      http.get("**/projects/new-project-id", () => {
        return HttpResponse.json(newProject);
      }),
      http.put("**/projects/*", () => {
        return HttpResponse.json(newProject);
      })
    );

    renderListPageOfType("timeline");

    await user.click(await screen.findByText("Create project"));
    await user.click(
      await screen.findByRole("button", { name: "Create cloud project" })
    );

    await waitFor(() => {
      const projectDialog = screen.getByRole("dialog");
      expect(projectDialog).toBeVisible();
      within(projectDialog)
        .getAllByText(/Untitled/)
        .forEach((name) => expect(name).toBeVisible());
    });
  });

  test("Creating from the Script list page makes a script-to-shots project and opens its tabs", async () => {
    const user = userEvent.setup();

    const newScriptProject = {
      id: "script-project-id",
      name: "Untitled",
      description: "",
      active: true,
      type: "script_to_shots",
      timelines: [],
      settings: { rangeMin: 0, rangeMax: 99 }
    };

    let putSettingsBody: Record<string, unknown> | undefined;

    mockServer.use(
      http.post("**/projects", () => {
        return HttpResponse.json(newScriptProject);
      }),
      http.put("**/projects/script-project-id", async ({ request }) => {
        const body = (await request.json()) as { settings?: unknown };
        putSettingsBody = body.settings as Record<string, unknown>;
        return HttpResponse.json({
          ...newScriptProject,
          settings: body.settings
        });
      })
    );

    renderListPageOfType("script_to_shots");

    await user.click(await screen.findByText("Create project"));
    await user.click(
      await screen.findByRole("button", { name: "Create cloud project" })
    );

    await waitFor(() => {
      expect(navigation.routerPushFn).toHaveBeenCalledWith(
        "/script-project?projectId=script-project-id"
      );
    });

    expect(putSettingsBody?.shot_engine).toBe("minimax_h3_max");
  });
});
