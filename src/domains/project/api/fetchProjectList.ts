import { type ProjectType, ProjectTypeSchema } from "@schemas/scriptProject";
import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";
import {
  type PaginatedResponse,
  paginatedResponseSchema
} from "@/schemas/pagination";

const projectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  total_renders: z.number(),
  total_img2img: z.number(),
  timeline_count: z.number(),
  preview_url: z.string().nullable(),
  sheet_preview_urls: z.array(z.string().nullable()).optional(),
  origin: z.enum(["local", "cloud"]).optional(),
  type: ProjectTypeSchema
});

export type ProjectListItem = z.infer<typeof projectListItemSchema>;

const projectListResponseSchema = paginatedResponseSchema(
  projectListItemSchema
);

export const DEFAULT_PER_PAGE = 12;

type ProjectListParams = {
  page?: number;
  perPage?: number;
  sortBy?: "updated_at" | "name";
  sortOrder?: "asc" | "desc";
  projectType?: ProjectType;
};

export const fetchProjectList = async ({
  page = 1,
  perPage = DEFAULT_PER_PAGE,
  sortBy = "updated_at",
  sortOrder = "desc",
  projectType
}: ProjectListParams = {}): Promise<PaginatedResponse<ProjectListItem>> => {
  if (!isLocalApp) {
    const response = await backendApiClient.get("/projects/homepage/list", {
      params: {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(projectType ? { type: projectType } : {})
      }
    });
    return projectListResponseSchema.parse(response.data);
  }
  const items = projectListResponseSchema.shape.items
    .parse(await getLocalDesktopApi().projects.list())
    .filter((item) => !projectType || item.type === projectType)
    .sort((left, right) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      return (
        direction * String(left[sortBy]).localeCompare(String(right[sortBy]))
      );
    });
  const offset = (page - 1) * perPage;
  const pageItems = items.slice(offset, offset + perPage);
  return projectListResponseSchema.parse({
    items: pageItems,
    pagination: {
      page,
      per_page: perPage,
      total: items.length,
      pages: Math.ceil(items.length / perPage),
      has_next: offset + perPage < items.length,
      has_prev: page > 1,
      next_num: offset + perPage < items.length ? page + 1 : null,
      prev_num: page > 1 ? page - 1 : null
    }
  });
};
