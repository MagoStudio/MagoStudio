import fs from "node:fs";
import path from "node:path";

import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

const ENGINES_EXPECTED_TO_DECLARE_WIRE_SOURCE_ROLES = [
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0
];

const WIRE_PIN_TEST_FILE_NAME_BY_ENGINE: Partial<Record<VideoEngine, string>> =
  {
    [VideoEngine.V3_4_0]: "magoV3_4_0.wire.test.ts",
    [VideoEngine.V4_0_0]: "magoV4_0_0.wire.test.ts",
    [VideoEngine.V4_1_0]: "magoV4_1_0.wire.test.ts",
    [VideoEngine.V5_0_0]: "magoV5_0_0.wire.test.ts"
  };

const enginesCurrentlyDeclaringWireSourceRoles = (): VideoEngine[] =>
  RENDER_MODELS.filter(
    (model) => (model.capabilities.wireSourceRoles ?? []).length > 0
  ).map((model) => model.name);

describe("wireSourceRoles declaration guard", () => {
  it("is declared by exactly the five engines this change's payload pins cover", () => {
    expect(enginesCurrentlyDeclaringWireSourceRoles().slice().sort()).toEqual(
      ENGINES_EXPECTED_TO_DECLARE_WIRE_SOURCE_ROLES.slice().sort()
    );
  });

  it("gives every engine that declares wireSourceRoles an existing pinned payload test file", () => {
    for (const engine of enginesCurrentlyDeclaringWireSourceRoles()) {
      const pinTestFileName = WIRE_PIN_TEST_FILE_NAME_BY_ENGINE[engine];

      expect(
        pinTestFileName,
        `${engine} declares wireSourceRoles but has no entry in WIRE_PIN_TEST_FILE_NAME_BY_ENGINE`
      ).toBeDefined();

      const pinTestFilePath = path.join(__dirname, pinTestFileName as string);

      expect(
        fs.existsSync(pinTestFilePath),
        `${engine}'s wire pin file "${pinTestFileName}" does not exist at ${pinTestFilePath}`
      ).toBe(true);
    }
  });
});
