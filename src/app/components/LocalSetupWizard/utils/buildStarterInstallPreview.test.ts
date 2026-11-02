import { describe, expect, it } from "vitest";

import { LOCAL_SETUP_FILE_COUNT } from "../localSetupWizardStubs";

import { buildStarterInstallPreview } from "./buildStarterInstallPreview";

describe("starter install preview", () => {
  it("lists the ComfyUI engine and every required model as waiting, before any download starts", () => {
    const preview = buildStarterInstallPreview();
    expect(preview.phase).toBe("idle");
    expect(preview.files).toHaveLength(LOCAL_SETUP_FILE_COUNT);
    expect(preview.files[0].name).toBe("ComfyUI engine ZIP");
    expect(
      preview.files.every(
        (file) => file.state === "waiting" && file.downloadedBytes === 0
      )
    ).toBe(true);
  });

  it("gives every file its own destination", () => {
    const destinations = buildStarterInstallPreview().files.map(
      (file) => file.destination
    );
    expect(new Set(destinations).size).toBe(destinations.length);
  });
});
