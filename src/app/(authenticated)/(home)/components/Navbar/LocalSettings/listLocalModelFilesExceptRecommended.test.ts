import { describe, expect, it } from "vitest";

import type { ModelFileChoice } from "../../../../../../../desktop/shared/modelSettings";

import { listLocalModelFilesExceptRecommended } from "./listLocalModelFilesExceptRecommended";

const choice = (filename: string): ModelFileChoice => ({
  filename,
  path: null,
  hasPassedModelCheck: false,
  loadTestOutcome: "untested",
  missingNodes: [],
  latestFileCheck: null,
  sourceUrl: null,
  expectedSha256: null,
  actualSha256: null
});
const recommendedFile = {
  filename: "Qwen-Image-Edit-2511-Q5_K_M.gguf",
  isInstalled: true,
  setupDownloadName: null,
  sourceUrl: null
};

describe("listLocalModelFilesExceptRecommended", () => {
  it("leaves the recommended file out of the local files", () => {
    expect(
      listLocalModelFilesExceptRecommended(
        [choice("Qwen-Image-Edit-2511-Q5_K_M.gguf"), choice("custom.gguf")],
        recommendedFile
      ).map((file) => file.filename)
    ).toEqual(["custom.gguf"]);
  });

  it("treats a differently cased copy as the recommended file", () => {
    expect(
      listLocalModelFilesExceptRecommended(
        [choice("qwen-image-edit-2511-q5_k_m.gguf"), choice("custom.gguf")],
        recommendedFile
      ).map((file) => file.filename)
    ).toEqual(["custom.gguf"]);
  });
});
