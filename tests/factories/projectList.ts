import { faker } from "@faker-js/faker";

const HASH_LENGTH = 64;

export interface ProjectListItemData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_renders: number;
  total_img2img: number;
  timeline_count: number;
  preview_url: string | null;
  type?: "timeline" | "script_to_shots";
}

export interface PaginatedProjectListData {
  items: ProjectListItemData[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
    next_num: number | null;
    prev_num: number | null;
  };
}

function createProjectListItemData(
  overrides?: Partial<ProjectListItemData>
): ProjectListItemData {
  const baseUrl = "https://mago-app-development.s3.amazonaws.com";
  const hash = faker.string.alphanumeric(HASH_LENGTH);

  const base: ProjectListItemData = {
    id: faker.string.uuid(),
    name: faker.word.noun() + " " + faker.number.int({ min: 1, max: 10 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    total_renders: faker.number.int({ min: 0, max: 10 }),
    total_img2img: faker.number.int({ min: 0, max: 20 }),
    timeline_count: faker.number.int({ min: 1, max: 5 }),
    preview_url: `${baseUrl}/uploads/${hash}/thumbnail_1.jpg`,
    type: "timeline"
  };

  return { ...base, ...overrides };
}

export function createProjectListData(
  count: number = 2,
  overrides?: Partial<ProjectListItemData>
): PaginatedProjectListData {
  const items = Array.from({ length: count }, () =>
    createProjectListItemData(overrides)
  );

  return {
    items,
    pagination: {
      page: 1,
      per_page: 12,
      total: count,
      pages: 1,
      has_next: false,
      has_prev: false,
      next_num: null,
      prev_num: null
    }
  };
}
