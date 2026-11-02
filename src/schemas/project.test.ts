import { describe, expect, it } from "vitest";

import { ProjectSchema } from "./project";

const projectWithLocalH3Model = (localH3Model: string) => ({
  id: "project-1",
  name: "Local project",
  description: null,
  active: true,
  settings: { local_h3_model: localH3Model }
});

describe("ProjectSchema local H3 model compatibility", () => {
  it.each(["base", "singularity", "hybrid", "quantfunc", "future-model"])(
    "keeps a project readable when an earlier or newer build persisted %s",
    (localH3Model) => {
      expect(
        ProjectSchema.parse(projectWithLocalH3Model(localH3Model)).settings
          .local_h3_model
      ).toBe(localH3Model);
    }
  );

  it("rejects a non-string legacy model value", () => {
    expect(() =>
      ProjectSchema.parse(projectWithLocalH3Model(42 as never))
    ).toThrow();
  });
});
