import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import { crossDomainImport, rule } from "./no-cross-domain-internal-imports.js";

// Wire oxlint's RuleTester to vitest so its cases run as vitest tests.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

ruleTester.run("no-cross-domain-internal-imports", rule, {
  valid: [
    {
      // Component importing a domain root hook — the public surface.
      filename: "/repo/src/app/(authenticated)/(home)/components/Foo.tsx",
      code: `import { useSelectedTracks } from "@domains/track/useSelectedTracks";`
    },
    {
      // Any file may import a domain's utils/ (pure functions).
      filename: "/repo/src/store/renderSettingsStore.ts",
      code: `import { parseSourcesForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";`
    },
    {
      // Intra-domain: a track root hook importing its own data/ via alias.
      filename: "/repo/src/domains/track/useSelectedTracks.ts",
      code: `import { useGetTracksById } from "@domains/track/data/useGetTracksById";`
    },
    {
      // Intra-domain: same, via relative path.
      filename: "/repo/src/domains/track/useSelectedTracks.ts",
      code: `import { useGetTracksById } from "./data/useGetTracksById";`
    },
    {
      // Intra-domain: a data hook reaching a sibling data file relatively.
      filename: "/repo/src/domains/shot/data/handleVideoAssetCreation.ts",
      code: `import { x } from "../data/useGetSelectedShotIdFromUrl";`
    },
    {
      // Intra-domain via the `@/domains/…` alias spelling (resolves into src/domains too).
      filename: "/repo/src/domains/track/useFilteredAndSortedTracks.tsx",
      code: `import { useGetTracksById } from "@/domains/track/data/useGetTracksById";`
    }
  ],
  invalid: [
    {
      // Component reaching into another domain's data/ internals (alias form).
      filename: "/repo/src/components/QueuePanel/ConnectedQueueRenderItem.tsx",
      code: `import { useGetTrackById } from "@domains/track/data/useGetTrackById";`,
      errors: 1
    },
    {
      // Cross-domain: the queue domain reaching into the track domain's data/.
      filename: "/repo/src/domains/queue/useQueueItemForTrack.ts",
      code: `import { useGetTrackById } from "@domains/track/data/useGetTrackById";`,
      errors: 1
    },
    {
      // Cross-domain api/ type import is also sealed.
      filename:
        "/repo/src/app/(authenticated)/(home)/components/VideoSettingsView/SettingItem.tsx",
      code: `import type { ImageAssetResponse } from "@domains/asset/api/interface";`,
      errors: 1
    },
    {
      // Relative cross-domain import (bypasses the @domains/ alias) is caught.
      filename: "/repo/src/domains/bulkUpload/useBulkUpload.ts",
      code: `import { useUploadAssetToS3 } from "../asset/data/useUploadAssetToS3";`,
      errors: 1
    },
    {
      // Relative cross-domain api import from a nested data/ file.
      filename: "/repo/src/domains/shot/data/handleVideoAssetCreation.ts",
      code: `import { useCreateVideoAsset } from "../../asset/data/useCreateVideoAsset";`,
      errors: 1
    },
    {
      // Re-export (`export … from`) of another domain's internals is caught.
      filename: "/repo/src/domains/queue/index.ts",
      code: `export { useGetTrackById } from "@domains/track/data/useGetTrackById";`,
      errors: 1
    },
    {
      // Dynamic import() of a string literal is caught.
      filename: "/repo/src/domains/queue/useQueueItemForTrack.ts",
      code: `const m = import("@domains/track/data/useGetTrackById");`,
      errors: 1
    },
    {
      // Cross-domain via the `@/domains/…` alias spelling must not slip past.
      filename: "/repo/src/domains/renders/useRenderSubmissionState.ts",
      code: `import { useGetTrackById } from "@/domains/track/data/useGetTrackById";`,
      errors: 1
    }
  ]
});

// RuleTester normalizes filenames to absolute paths, so it cannot exercise the
// repo-RELATIVE filename form that oxlint hands the rule in CI (which once caused
// intra-domain imports to be flagged as cross-domain). These call the pure helper
// directly with BOTH absolute and relative filenames to lock that parity down.
describe("crossDomainImport — path-format parity (absolute vs repo-relative)", () => {
  const absolute =
    "/home/runner/work/Mago/Mago/src/domains/project/useDeleteProject.ts";
  const relative = "src/domains/project/useDeleteProject.ts";

  it("allows an intra-domain alias import regardless of filename rootedness", () => {
    const source = "@domains/project/api/fetchProjectList";
    expect(crossDomainImport(absolute, source)).toBeNull();
    expect(crossDomainImport(relative, source)).toBeNull();
  });

  it("allows an intra-domain relative import regardless of filename rootedness", () => {
    const source = "./api/fetchProjectList";
    expect(crossDomainImport(absolute, source)).toBeNull();
    expect(crossDomainImport(relative, source)).toBeNull();
  });

  it("flags a cross-domain alias import regardless of filename rootedness", () => {
    const source = "@domains/track/data/useGetTrackById";
    expect(crossDomainImport(absolute, source)).toEqual({
      domain: "track",
      layer: "data"
    });
    expect(crossDomainImport(relative, source)).toEqual({
      domain: "track",
      layer: "data"
    });
  });

  it("flags a cross-domain relative import regardless of filename rootedness", () => {
    const source = "../track/data/useGetTrackById";
    expect(crossDomainImport(absolute, source)).toEqual({
      domain: "track",
      layer: "data"
    });
    expect(crossDomainImport(relative, source)).toEqual({
      domain: "track",
      layer: "data"
    });
  });

  it("ignores non-domain imports", () => {
    expect(crossDomainImport(relative, "react")).toBeNull();
    expect(
      crossDomainImport(relative, "@domains/track/useSelectedTracks")
    ).toBeNull();
    expect(
      crossDomainImport(
        relative,
        "@domains/renders/utils/parseRenderDataForFrontend"
      )
    ).toBeNull();
  });
});
