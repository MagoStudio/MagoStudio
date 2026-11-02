import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { mergeProjectsIntoFolderTree } from "./useProjectFolders";

const project = (id: string, name: string): Project => ({
  id,
  name,
  description: null,
  active: true,
  type: "timeline",
  settings: {}
});

describe("mergeProjectsIntoFolderTree", () => {
  it("shows real projects immediately when folder metadata is empty", () => {
    expect(
      mergeProjectsIntoFolderTree(
        [],
        [
          project("local-1", "Local project"),
          project("cloud-1", "Cloud project")
        ]
      )
    ).toEqual([
      expect.objectContaining({
        id: "local-1",
        name: "Local project",
        parentFolderId: "",
        type: "project"
      }),
      expect.objectContaining({
        id: "cloud-1",
        name: "Cloud project",
        parentFolderId: "",
        type: "project"
      })
    ]);
  });

  it("keeps configured folders while adding only missing projects at root", () => {
    const result = mergeProjectsIntoFolderTree(
      [
        {
          id: "folder-1",
          name: "Films",
          parentFolderId: "",
          createdAt: 1,
          type: "folder"
        },
        {
          id: "project-1",
          name: "Stale name",
          parentFolderId: "folder-1",
          createdAt: 2,
          type: "project"
        }
      ],
      [project("project-1", "Current name"), project("project-2", "New")]
    );

    expect(result).toEqual([
      expect.objectContaining({ id: "folder-1", type: "folder" }),
      expect.objectContaining({
        id: "project-1",
        name: "Current name",
        parentFolderId: "folder-1"
      }),
      expect.objectContaining({
        id: "project-2",
        name: "New",
        parentFolderId: ""
      })
    ]);
  });
});
