import { describe, expect, it } from "vitest";

import { sortShotIdsByShotName } from "./sortShotIdsByShotName";

describe("sortShotIdsByShotName", () => {
  it("orders Shot ids A→Z by resolved Shot name", () => {
    const shotNameById = new Map([
      ["shot-1", "Ungrouped shot"],
      ["shot-2", "Open shot"],
      ["shot-3", "Shot in top folder"]
    ]);

    const sortedShotIds = sortShotIdsByShotName(
      ["shot-1", "shot-2", "shot-3"],
      shotNameById
    );

    expect(sortedShotIds).toEqual(["shot-2", "shot-3", "shot-1"]);
  });

  it("sorts a Shot with no resolvable name by its Shot id", () => {
    const shotNameById = new Map([["shot-1", "Zebra shot"]]);

    const sortedShotIds = sortShotIdsByShotName(
      ["shot-1", "shot-unresolved"],
      shotNameById
    );

    expect(sortedShotIds).toEqual(["shot-unresolved", "shot-1"]);
  });

  it("moves an earlier-named Shot to the front while keeping equal-named Shots in their input order", () => {
    const shotNameById = new Map([
      ["shot-zebra-1", "Zebra shot"],
      ["shot-banana", "Banana shot"],
      ["shot-zebra-2", "Zebra shot"]
    ]);

    const sortedShotIds = sortShotIdsByShotName(
      ["shot-zebra-1", "shot-banana", "shot-zebra-2"],
      shotNameById
    );

    expect(sortedShotIds).toEqual([
      "shot-banana",
      "shot-zebra-1",
      "shot-zebra-2"
    ]);
  });

  it("never mutates the input array", () => {
    const shotNameById = new Map([
      ["shot-1", "Zebra shot"],
      ["shot-2", "Apple shot"]
    ]);
    const inputShotIds = ["shot-1", "shot-2"];

    sortShotIdsByShotName(inputShotIds, shotNameById);

    expect(inputShotIds).toEqual(["shot-1", "shot-2"]);
  });
});
