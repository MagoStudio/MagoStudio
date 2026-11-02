import { beforeEach, expect, it, vi } from "vitest";

import {
  clearLibraryIssues,
  listLibraryIssues,
  runBackgroundTask
} from "./libraryHealth";
beforeEach(() => {
  clearLibraryIssues();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it("contains a rejected task and clears the warning after a successful retry", async () => {
  await expect(
    runBackgroundTask("Render polling", async () => {
      throw new Error("Drive disconnected");
    })
  ).resolves.toBeUndefined();
  expect(listLibraryIssues()).toEqual([
    expect.objectContaining({
      kind: "service",
      message: expect.stringContaining("Drive disconnected")
    })
  ]);
  await runBackgroundTask("Render polling", async () => {});
  expect(listLibraryIssues()).toEqual([]);
});
