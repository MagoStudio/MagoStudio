import { faker } from "@faker-js/faker";

import { LayerType } from "@/schemas/layer";
import { Project, ProjectItem } from "@/schemas/project";

import { createLayer } from "./layer";
import { createShot } from "./shot";
import { USER_TEST_ID } from "./user";

export function createProject(overrides?: Partial<Project>): Project {
  const baseProject = {
    id: faker.string.uuid(),
    name: faker.music.songName(),
    description: faker.lorem.sentence(),
    user_id: USER_TEST_ID,
    active: true,
    type: "timeline" as const,
    settings: {}
  };

  const imageLayer = createLayer({ type: LayerType.IMAGE, layer_order: 1 });
  const renderLayer = createLayer({ type: LayerType.RENDER, layer_order: 2 });

  const layers = [imageLayer, renderLayer];

  const shot = createShot({ project_id: baseProject.id, layers });

  return {
    ...baseProject,
    timelines: [shot],
    ...overrides
  };
}

export function createDummyFolder(overrides?: Partial<Project>): Project {
  return {
    id: faker.string.uuid(),
    name: USER_TEST_ID,
    description: "Folder dummy project",
    active: true,
    type: "timeline" as const,
    settings: {},
    ...overrides
  };
}

export function createProjectItem(
  overrides?: Partial<ProjectItem>
): ProjectItem {
  return {
    id: faker.string.uuid(),
    name: faker.word.noun(),
    parentFolderId: "",
    type: "project",
    createdAt: faker.date.past().getTime(),
    ...overrides
  };
}
