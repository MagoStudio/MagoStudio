import { describe, expect, it } from "vitest";

import { bucketFilmstripWidth } from "./bucketFilmstripWidth";

describe("bucketFilmstripWidth", () => {
  it("rounds up to the next bucket", () => {
    expect(bucketFilmstripWidth(50)).toBe(200);
    expect(bucketFilmstripWidth(200)).toBe(200);
    expect(bucketFilmstripWidth(333)).toBe(400);
    expect(bucketFilmstripWidth(500)).toBe(800);
  });

  it("caps at the largest bucket", () => {
    expect(bucketFilmstripWidth(5000)).toBe(1600);
  });
});
