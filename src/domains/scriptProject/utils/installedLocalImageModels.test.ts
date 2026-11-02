import { expect, it } from "vitest";

import { installedLocalImageModels } from "./installedLocalImageModels";

it("offers only models whose complete setup is known installed", () => {
  expect(installedLocalImageModels(undefined)).toEqual([]);
  expect(
    installedLocalImageModels({
      optional: [
        {
          id: "qwen-image-sheet",
          requirements: [{ status: "installed" }, { status: "unknown" }]
        },
        { id: "flux-klein-4b-sheet", requirements: [{ status: "installed" }] },
        { id: "flux-klein-9b-sheet", requirements: [] }
      ]
    })
  ).toEqual(["flux2_klein_4b_q8_local"]);
});
