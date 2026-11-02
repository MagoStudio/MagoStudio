import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { SidebarProjectTypeLinks } from "./SidebarProjectTypeLinks";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

const renderAt = (pathname: string, search = "") => {
  navigation.pathname = pathname;
  navigation.searchParams = new URLSearchParams(search);
  return renderWithProviders(<SidebarProjectTypeLinks />);
};

describe("SidebarProjectTypeLinks", () => {
  beforeEach(() => {
    navigation.pathname = "/";
    navigation.searchParams = new URLSearchParams();
  });

  it("lists the available project types in order, as text only", () => {
    renderAt("/");

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent)
    ).toEqual(["Video to Video", "Mago Director"]);
    screen.getAllByRole("listitem").forEach((item) => {
      expect(within(item).queryByRole("img")).toBeNull();
      expect(item.querySelector("svg")).toBeNull();
    });
  });

  it("links each available project type to its list page", () => {
    renderAt("/");

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Mago Director" })).toHaveAttribute(
      "href",
      "/projects?type=script_to_shots"
    );
  });

  it("leaves Coming soon project types out of the sidebar", () => {
    renderAt("/");

    expect(screen.queryByText("Generate image")).toBeNull();
  });

  it("marks the list page's type as the current page", () => {
    renderAt("/projects/", "type=script_to_shots");

    expect(screen.getByRole("link", { name: "Mago Director" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("link", { name: "Video to Video" })
    ).not.toHaveAttribute("aria-current");
  });

  it("marks Script while a Script Project is open", () => {
    renderAt("/script-project/", "projectId=p1");

    expect(screen.getByRole("link", { name: "Mago Director" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("marks nothing on the home page", () => {
    renderAt("/");

    screen.getAllByRole("link").forEach((link) => {
      expect(link).not.toHaveAttribute("aria-current");
    });
  });
});
