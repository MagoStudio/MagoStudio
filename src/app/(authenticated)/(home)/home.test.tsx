import { QueryClient } from "@tanstack/react-query";
import { screen, within } from "@testing-library/react";
import { createProjectListData } from "@tests/factories/projectList";
import { mockServer } from "@tests/fixtures/handlers";
import { http, HttpResponse } from "msw";
import { expect, test, vi, describe } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import HomePage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams()
}));

describe("Homepage", () => {
  test("User sees a card for every tool, in the sidebar's order", () => {
    renderWithProviders(<HomePage />);

    const toolsBlock = screen.getByRole("region", { name: "Tools" });

    expect(
      within(toolsBlock)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "Video to Video",
      "Mago Director",
      "Generate image",
      "Generate video"
    ]);
    expect(
      within(toolsBlock)
        .getAllByRole("link")
        .map((toolLink) => toolLink.getAttribute("href"))
    ).toEqual(["/projects?type=timeline", "/projects?type=script_to_shots"]);
  });

  test.each(["Generate image", "Generate video"])(
    "%s shows as Coming soon and opens nothing",
    (toolLabel) => {
      renderWithProviders(<HomePage />);

      const toolsBlock = screen.getByRole("region", { name: "Tools" });
      const comingSoonCard = within(toolsBlock)
        .getByRole("heading", { name: toolLabel })
        .closest("[aria-disabled]");

      expect(comingSoonCard).toHaveAttribute("aria-disabled", "true");
      expect(comingSoonCard).toHaveTextContent("Coming soon");
      expect(comingSoonCard?.closest("a")).toBeNull();
    }
  );

  test("User sees the YouTube tutorials and Discord cards", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("Check our YouTube tutorials")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/playlist?list=PLDRNG_57XYmYBCTxohrfF0Ff8G5200Yxx"
    );
    expect(screen.getByRole("link", { name: "Open Discord" })).toBeVisible();
  });

  test("User sees their recent projects, with no Create project tile", async () => {
    mockServer.use(
      http.get("**/projects/homepage/list", () =>
        HttpResponse.json(
          createProjectListData(2, { name: "Test Project", type: "timeline" })
        )
      )
    );

    renderWithProviders(<HomePage />, { queryClient: new QueryClient() });

    const projectTitles = await screen.findAllByText("Test Project");
    expect(projectTitles).toHaveLength(2);
    expect(screen.getByText("My projects")).toBeVisible();
    expect(screen.queryByText("Create project")).toBeNull();
  });

  test("Homepage shows no tutorial slideshow and no newsfeed", async () => {
    renderWithProviders(<HomePage />);
    await screen.findByRole("region", { name: "Tools" });

    expect(screen.queryByRole("link", { name: "Tutorial slide" })).toBeNull();
    expect(screen.queryByText(/Kling 3\.0 is live/)).toBeNull();
  });
});
