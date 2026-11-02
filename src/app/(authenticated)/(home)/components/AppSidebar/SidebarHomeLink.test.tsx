import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { SidebarHomeLink } from "./SidebarHomeLink";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname
}));

const renderAt = (pathname: string) => {
  navigation.pathname = pathname;
  return renderWithProviders(<SidebarHomeLink />);
};

describe("SidebarHomeLink", () => {
  it("links Home to the home page", () => {
    renderAt("/projects/");

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("marks Home as the current page on the home page", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it.each(["/projects/", "/project/", "/script-project/"])(
    "does not mark Home on %s",
    (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
        "aria-current"
      );
    }
  );
});
