import { describe, expect, it } from "vitest";

import {
  LOCAL_SCRIPT_TEXT_MODELS,
  LOCAL_VLM_BACKENDS
} from "../../shared/contracts";
import { LOCAL_MODEL_LICENSES } from "../../shared/localModelLicenses";
import { LOCAL_MODEL_BUNDLES } from "../../shared/localModelManifest";

import { optionalScriptSetups } from "./optionalScriptSetups";

const HUGGING_FACE_REPO_PATTERN = /^https:\/\/huggingface\.co\/([^/]+\/[^/]+)/;

const huggingFaceRepoOf = (url: string) =>
  HUGGING_FACE_REPO_PATTERN.exec(url)?.[1] ?? null;

const licensedRepos = new Set(
  LOCAL_MODEL_LICENSES.map((license) => license.huggingFaceRepo)
);

describe("local model licenses", () => {
  it("lists every Hugging Face repo the starter installer downloads", () => {
    const starterRepos = LOCAL_MODEL_BUNDLES.flatMap((bundle) =>
      bundle.files.map((file) => huggingFaceRepoOf(file.url))
    ).filter((repo) => repo !== null);

    expect(starterRepos.length).toBeGreaterThan(0);
    for (const repo of starterRepos) expect(licensedRepos).toContain(repo);
  });

  it("lists every Hugging Face repo an optional ComfyUI setup can download", () => {
    const optionalRepos = LOCAL_VLM_BACKENDS.flatMap((vlmBackend) =>
      LOCAL_SCRIPT_TEXT_MODELS.flatMap((scriptTextModel) =>
        optionalScriptSetups({ vlmBackend, scriptTextModel }).flatMap((setup) =>
          setup.files.map((file) => huggingFaceRepoOf(file.url ?? ""))
        )
      )
    ).filter((repo) => repo !== null);

    expect(optionalRepos.length).toBeGreaterThan(0);
    for (const repo of optionalRepos) expect(licensedRepos).toContain(repo);
  });
});
