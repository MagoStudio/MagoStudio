import { describe, expect, test, vi } from "vitest";

import { enrichUnsafeMetadata } from "./enrichUnsafeMetadata";

type Store = Record<string, unknown>;

const deepMergeNullDeletes = (target: Store, patch: Store): void => {
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete target[key];
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const nested = (target[key] ??= {}) as Store;
      deepMergeNullDeletes(nested, value as Store);
    } else {
      target[key] = value;
    }
  }
};

const makeFakeUser = () => {
  const store: Store = {};
  const update = vi.fn(async () => undefined);
  const updateMetadata = vi.fn(
    async ({ unsafeMetadata }: { unsafeMetadata: Store }) => {
      deepMergeNullDeletes(store, unsafeMetadata);
      return undefined;
    }
  );
  return { store, update, updateMetadata };
};

const asUser = (fake: ReturnType<typeof makeFakeUser>) =>
  fake as unknown as Parameters<typeof enrichUnsafeMetadata>[0];

describe("enrichUnsafeMetadata", () => {
  test("forwards the patch to updateMetadata as unsafeMetadata", async () => {
    const fake = makeFakeUser();

    await enrichUnsafeMetadata(asUser(fake), { referral_id: "abc" });

    expect(fake.updateMetadata).toHaveBeenCalledWith({
      unsafeMetadata: { referral_id: "abc" }
    });
    expect(fake.update).not.toHaveBeenCalled();
  });

  test("issues a separate update call for top-level fields when provided", async () => {
    const fake = makeFakeUser();

    await enrichUnsafeMetadata(
      asUser(fake),
      { profession: "vfx" },
      { firstName: "Ada", lastName: "Lovelace" }
    );

    expect(fake.update).toHaveBeenCalledWith({
      firstName: "Ada",
      lastName: "Lovelace"
    });
    expect(fake.updateMetadata).toHaveBeenCalledWith({
      unsafeMetadata: { profession: "vfx" }
    });
  });

  test("Clerk deep-merge contract: concurrent writers each persist their own key without clobbering", async () => {
    const fake = makeFakeUser();

    await Promise.all([
      enrichUnsafeMetadata(asUser(fake), { referral_id: "r1" }),
      enrichUnsafeMetadata(asUser(fake), { google_analytics_user_id: "g1" }),
      enrichUnsafeMetadata(asUser(fake), { utm: { utm_source: "news" } })
    ]);

    expect(fake.store).toEqual({
      referral_id: "r1",
      google_analytics_user_id: "g1",
      utm: { utm_source: "news" }
    });
  });

  test("Clerk deep-merge contract: null keys delete (utm touch replacement)", async () => {
    const fake = makeFakeUser();
    fake.store.utm = { utm_source: "A", utm_campaign: "X" };

    await enrichUnsafeMetadata(asUser(fake), {
      utm: {
        utm_source: "B",
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null
      }
    });

    expect(fake.store.utm).toEqual({ utm_source: "B" });
  });
});
