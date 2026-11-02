import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { fetchProjectList } from "./fetchProjectList";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn() }
}));

const emptyPage = {
  items: [],
  pagination: {
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
    next_num: null,
    prev_num: null
  }
};

const listItem = {
  id: "p1",
  name: "Project",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  total_renders: 0,
  total_img2img: 0,
  timeline_count: 1,
  preview_url: null
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(backendApiClient.get).mockResolvedValue({ data: emptyPage });
});

describe("fetchProjectList", () => {
  it("asks for one project type when given one", async () => {
    await fetchProjectList({ projectType: "script_to_shots" });

    expect(backendApiClient.get).toHaveBeenCalledWith(
      "/projects/homepage/list",
      {
        params: {
          page: 1,
          per_page: 12,
          sort_by: "updated_at",
          sort_order: "desc",
          type: "script_to_shots"
        }
      }
    );
  });

  it("sends no type when none is given", async () => {
    await fetchProjectList();

    expect(backendApiClient.get).toHaveBeenCalledWith(
      "/projects/homepage/list",
      {
        params: {
          page: 1,
          per_page: 12,
          sort_by: "updated_at",
          sort_order: "desc"
        }
      }
    );
  });

  it("reads each project's type", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: { ...emptyPage, items: [{ ...listItem, type: "script_to_shots" }] }
    });

    const response = await fetchProjectList();

    expect(response.items[0]?.type).toBe("script_to_shots");
  });

  it("reads a Script project's sheet images, gaps included", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: {
        ...emptyPage,
        items: [
          {
            ...listItem,
            type: "script_to_shots",
            sheet_preview_urls: [null, "https://example.com/sheet.jpg"]
          }
        ]
      }
    });

    const response = await fetchProjectList();

    expect(response.items[0]?.sheet_preview_urls).toEqual([
      null,
      "https://example.com/sheet.jpg"
    ]);
  });

  it("treats a project without a type as Video to Video", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: { ...emptyPage, items: [listItem] }
    });

    const response = await fetchProjectList();

    expect(response.items[0]?.type).toBe("timeline");
  });
});
