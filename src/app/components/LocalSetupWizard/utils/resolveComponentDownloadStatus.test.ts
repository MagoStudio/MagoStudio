import { describe, expect, it } from "vitest";

import { LocalSetupComponent } from "../localSetupWizardStubs";

import { resolveComponentDownloadStatus } from "./resolveComponentDownloadStatus";

const components: LocalSetupComponent[] = [
  { id: "engine", name: "Engine", gigabytes: 4 },
  { id: "animate", name: "Animate", gigabytes: 10 },
  { id: "edit", name: "Edit", gigabytes: 6 }
];

const statusOf = (componentId: string, downloadedGigabytes: number) =>
  resolveComponentDownloadStatus({
    components,
    componentId,
    downloadedGigabytes
  });

describe("resolveComponentDownloadStatus", () => {
  it("reports a component as waiting until the ones before it finish", () => {
    expect(statusOf("animate", 3)).toEqual({ kind: "waiting" });
    expect(statusOf("edit", 13)).toEqual({ kind: "waiting" });
  });

  it("reports a component as done once its own bytes have arrived", () => {
    expect(statusOf("engine", 4)).toEqual({ kind: "done" });
    expect(statusOf("animate", 14)).toEqual({ kind: "done" });
  });

  it("reports progress within the component that is currently downloading", () => {
    expect(statusOf("animate", 9)).toEqual({
      kind: "inProgress",
      percentage: 50
    });
  });

  it("treats an exact boundary as the earlier component being done", () => {
    expect(statusOf("engine", 4)).toEqual({ kind: "done" });
    expect(statusOf("animate", 4)).toEqual({ kind: "waiting" });
  });

  it("reports an unknown component as waiting", () => {
    expect(statusOf("missing", 20)).toEqual({ kind: "waiting" });
  });
});
