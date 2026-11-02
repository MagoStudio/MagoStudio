import { describe, expect, it } from "vitest";

import {
  isLocalFolderDummyProject,
  LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION,
  OFFLINE_LOCAL_USER_ID
} from "./localFolderDummyProject";

describe("isLocalFolderDummyProject", () => {
  it("recognises the offline folder project by name and description", () => {
    expect(
      isLocalFolderDummyProject({
        name: OFFLINE_LOCAL_USER_ID,
        description: LOCAL_FOLDER_DUMMY_PROJECT_DESCRIPTION
      })
    ).toBe(true);
  });

  it("keeps a user project that is only named like the offline user", () => {
    expect(
      isLocalFolderDummyProject({
        name: OFFLINE_LOCAL_USER_ID,
        description: ""
      })
    ).toBe(false);
  });
});
