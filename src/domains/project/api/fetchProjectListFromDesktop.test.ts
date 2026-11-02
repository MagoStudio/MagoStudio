import { describe, expect, it, vi } from "vitest";

import { fetchProjectList } from "./fetchProjectList";

const buildListItem = (id: string, type: "timeline" | "script_to_shots") => ({
  id,
  name: id,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: `2026-10-${id.padStart(2, "0")}T00:00:00Z`,
  total_renders: 0,
  total_img2img: 0,
  timeline_count: 1,
  preview_url: null,
  origin: "local",
  type
});

const desktopProjects = [
  buildListItem("1", "script_to_shots"),
  buildListItem("2", "timeline"),
  buildListItem("3", "timeline"),
  buildListItem("4", "script_to_shots"),
  buildListItem("5", "timeline")
];

vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => ({
    projects: { list: async () => desktopProjects }
  })
}));

describe("fetchProjectList on the desktop", () => {
  it("filters by project type before paging, so a page is never short", async () => {
    const firstPage = await fetchProjectList({
      projectType: "timeline",
      perPage: 2
    });

    expect(firstPage.items.map((item) => item.id)).toEqual(["5", "3"]);
    expect(firstPage.pagination.total).toBe(3);
    expect(firstPage.pagination.has_next).toBe(true);
  });

  it("lists every type when none is given", async () => {
    const page = await fetchProjectList({ perPage: 10 });

    expect(page.items).toHaveLength(5);
  });
});
