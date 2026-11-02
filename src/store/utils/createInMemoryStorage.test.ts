import { describe, expect, it } from "vitest";

import { createInMemoryStorage } from "./createInMemoryStorage";

describe("createInMemoryStorage", () => {
  it("returns the initial value when a key has never been set", () => {
    const storage = createInMemoryStorage<string>();

    expect(storage.getItem("input-track-id", "fallback")).toBe("fallback");
  });

  it("returns the stored value once a key has been set", () => {
    const storage = createInMemoryStorage<string>();

    storage.setItem("input-track-id", "track-1");

    expect(storage.getItem("input-track-id", "fallback")).toBe("track-1");
  });

  it("falls back to the initial value again once a key is removed", () => {
    const storage = createInMemoryStorage<string>();

    storage.setItem("input-track-id", "track-1");
    storage.removeItem("input-track-id");

    expect(storage.getItem("input-track-id", "fallback")).toBe("fallback");
  });

  it("keeps values for different keys independent", () => {
    const storage = createInMemoryStorage<string>();

    storage.setItem("input-track-id-shot-a", "track-a");
    storage.setItem("input-track-id-shot-b", "track-b");

    expect(storage.getItem("input-track-id-shot-a", "fallback")).toBe(
      "track-a"
    );
    expect(storage.getItem("input-track-id-shot-b", "fallback")).toBe(
      "track-b"
    );
  });

  it("keeps separate instances from sharing state", () => {
    const storageA = createInMemoryStorage<string>();
    const storageB = createInMemoryStorage<string>();

    storageA.setItem("input-track-id", "track-a");

    expect(storageB.getItem("input-track-id", "fallback")).toBe("fallback");
  });
});
