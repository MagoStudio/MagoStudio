import { describe, expect, it } from "vitest";

import type { ModelSettingsSnapshot } from "../../../../../../../desktop/shared/modelSettings";

import { resolveModelFileInUse } from "./resolveModelFileInUse";

const componentUsing = (selectedFile: string, installedFilenames: string[]) =>
  ({
    selectedFile,
    recommendedFile: { filename: installedFilenames[0] ?? selectedFile },
    choices: installedFilenames.map((filename) => ({ filename }))
  }) as unknown as ModelSettingsSnapshot["components"][number];

describe("resolveModelFileInUse", () => {
  it("returns the installed spelling of the file in use", () => {
    expect(
      resolveModelFileInUse(
        componentUsing("Qwen-Main.gguf", ["qwen-main.gguf", "custom.gguf"])
      )
    ).toBe("qwen-main.gguf");
  });

  it("keeps the file name when no installed file matches it", () => {
    expect(
      resolveModelFileInUse(componentUsing("missing.gguf", ["custom.gguf"]))
    ).toBe("missing.gguf");
  });
});
