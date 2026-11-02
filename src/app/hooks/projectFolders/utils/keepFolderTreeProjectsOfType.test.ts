import { FolderOrProject } from "@hooks/projectFolders/interface";
import { describe, expect, it } from "vitest";

import { keepFolderTreeProjectsOfType } from "./keepFolderTreeProjectsOfType";

const folder = (id: string): FolderOrProject => ({
  id,
  name: id,
  parentFolderId: "",
  type: "folder",
  createdAt: 0
});

const projectRow = (id: string, parentFolderId = ""): FolderOrProject => ({
  id,
  name: id,
  parentFolderId,
  type: "project",
  createdAt: 0
});

describe("keepFolderTreeProjectsOfType", () => {
  it("keeps every folder and only the project rows of the given type", () => {
    const folderTreeItems = [
      folder("folder-1"),
      projectRow("video-1", "folder-1"),
      projectRow("script-1", "folder-1"),
      projectRow("video-2")
    ];

    expect(
      keepFolderTreeProjectsOfType({
        folderTreeItems,
        projects: [
          { id: "video-1", type: "timeline" },
          { id: "script-1", type: "script_to_shots" },
          { id: "video-2", type: "timeline" }
        ],
        projectType: "timeline"
      }).map((item) => item.id)
    ).toEqual(["folder-1", "video-1", "video-2"]);
  });

  it("keeps a folder whose projects are all of another type, so it shows empty", () => {
    expect(
      keepFolderTreeProjectsOfType({
        folderTreeItems: [
          folder("folder-1"),
          projectRow("script-1", "folder-1")
        ],
        projects: [{ id: "script-1", type: "script_to_shots" }],
        projectType: "timeline"
      }).map((item) => item.id)
    ).toEqual(["folder-1"]);
  });

  it("treats a project without a stored type as Video to Video", () => {
    expect(
      keepFolderTreeProjectsOfType({
        folderTreeItems: [projectRow("legacy-1")],
        projects: [{ id: "legacy-1", type: undefined }],
        projectType: "timeline"
      }).map((item) => item.id)
    ).toEqual(["legacy-1"]);
  });

  it("drops a project row whose project is not in the list", () => {
    expect(
      keepFolderTreeProjectsOfType({
        folderTreeItems: [projectRow("unknown-1")],
        projects: [],
        projectType: "timeline"
      })
    ).toEqual([]);
  });
});
