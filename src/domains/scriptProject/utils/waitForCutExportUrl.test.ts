import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/getProjectCut", () => ({ getProjectCut: vi.fn() }));

import { getProjectCut } from "../api/getProjectCut";

import { waitForCutExportUrl } from "./waitForCutExportUrl";

const getProjectCutMock = getProjectCut as unknown as ReturnType<typeof vi.fn>;

const PROJECT_ID = "project-1";
const PLAN_ID = "plan-1";
const EXPORT_URL = "https://cdn.example.com/cut.mp4";

const cutWithExport = (
  exportFields: Record<string, unknown> | null
): unknown => ({
  project_id: PROJECT_ID,
  shots: [],
  missing: [],
  export: exportFields
});

const noSleep = () => Promise.resolve();

describe("waitForCutExportUrl", () => {
  beforeEach(() => {
    getProjectCutMock.mockReset();
  });

  it("returns the URL once the upload has landed", async () => {
    getProjectCutMock.mockResolvedValueOnce(
      cutWithExport({ plan_id: PLAN_ID, url: EXPORT_URL, stale: false })
    );

    await expect(
      waitForCutExportUrl({
        projectId: PROJECT_ID,
        planId: PLAN_ID,
        sleep: noSleep
      })
    ).resolves.toBe(EXPORT_URL);
  });

  it("keeps polling while the file has no URL yet", async () => {
    getProjectCutMock
      .mockResolvedValueOnce(
        cutWithExport({ plan_id: PLAN_ID, url: null, stale: false })
      )
      .mockResolvedValueOnce(
        cutWithExport({ plan_id: PLAN_ID, url: EXPORT_URL, stale: false })
      );

    await expect(
      waitForCutExportUrl({
        projectId: PROJECT_ID,
        planId: PLAN_ID,
        sleep: noSleep
      })
    ).resolves.toBe(EXPORT_URL);
    expect(getProjectCutMock).toHaveBeenCalledTimes(2);
  });

  it("ignores an older export still recorded on the cut", async () => {
    getProjectCutMock
      .mockResolvedValueOnce(
        cutWithExport({
          plan_id: "an-earlier-plan",
          url: "https://cdn.example.com/yesterday.mp4",
          stale: true
        })
      )
      .mockResolvedValueOnce(
        cutWithExport({ plan_id: PLAN_ID, url: EXPORT_URL, stale: false })
      );

    await expect(
      waitForCutExportUrl({
        projectId: PROJECT_ID,
        planId: PLAN_ID,
        sleep: noSleep
      })
    ).resolves.toBe(EXPORT_URL);
  });

  it("gives up rather than polling forever, so the caller can fall back", async () => {
    getProjectCutMock.mockResolvedValue(cutWithExport(null));

    await expect(
      waitForCutExportUrl({
        projectId: PROJECT_ID,
        planId: PLAN_ID,
        sleep: noSleep
      })
    ).resolves.toBeNull();
  });
});
