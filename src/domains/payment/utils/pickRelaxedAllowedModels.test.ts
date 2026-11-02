import { SubscriptionType } from "@schemas/balance";
import { PaymentType, PriceOption } from "@schemas/price";
import { describe, expect, it } from "vitest";

import { pickRelaxedAllowedModels } from "./pickRelaxedAllowedModels";

const makeCard = (
  title: SubscriptionType,
  relaxed_allowed_models?: string[]
): PriceOption => ({
  id: `price-${title}`,
  payment_type: PaymentType.SUBSCRIPTION,
  price: 0,
  credits: 0,
  discount: 0,
  currency: "eur",
  features: { title, relaxed_allowed_models }
});

const STUDIO_FULL = [
  "v5.0.0",
  "kling_o1",
  "seedance_2",
  "happy_horse_1",
  "gpt_image_2"
];

describe("pickRelaxedAllowedModels", () => {
  it("returns the matching plan card's list", () => {
    const cards = [
      makeCard(SubscriptionType.UNLIMITED_PRO, ["v5.0.0", "gpt_image_2"]),
      makeCard(SubscriptionType.UNLIMITED_STUDIO, STUDIO_FULL)
    ];
    expect(
      pickRelaxedAllowedModels(cards, SubscriptionType.UNLIMITED_STUDIO, [])
    ).toEqual(STUDIO_FULL);
  });

  it("prefers the current card over a stale snapshot", () => {
    const staleSnapshot = ["v5.0.0", "gpt_image_2"];
    const cards = [makeCard(SubscriptionType.UNLIMITED_STUDIO, STUDIO_FULL)];
    const result = pickRelaxedAllowedModels(
      cards,
      SubscriptionType.UNLIMITED_STUDIO,
      staleSnapshot
    );
    expect(result).toEqual(STUDIO_FULL);
    expect(result).toContain("seedance_2");
  });

  it("falls back to the snapshot when no card matches (legacy plan)", () => {
    const snapshot = ["v5.0.0", "gpt_image_2"];
    const cards = [makeCard(SubscriptionType.UNLIMITED_PRO, ["v5.0.0"])];
    expect(
      pickRelaxedAllowedModels(
        cards,
        SubscriptionType.UNLIMITED_STUDIO,
        snapshot
      )
    ).toEqual(snapshot);
  });

  it("falls back to the snapshot when cards are undefined (prices loading)", () => {
    const snapshot = ["v5.0.0"];
    expect(
      pickRelaxedAllowedModels(
        undefined,
        SubscriptionType.UNLIMITED_STUDIO,
        snapshot
      )
    ).toEqual(snapshot);
  });

  it("treats a matched card with an explicit empty list as fail-closed, not snapshot", () => {
    const snapshot = ["v5.0.0", "gpt_image_2"];
    const cards = [makeCard(SubscriptionType.UNLIMITED_STUDIO, [])];
    expect(
      pickRelaxedAllowedModels(
        cards,
        SubscriptionType.UNLIMITED_STUDIO,
        snapshot
      )
    ).toEqual([]);
  });

  it("falls back to the snapshot when the matched card omits the field", () => {
    const snapshot = ["v5.0.0"];
    const cards = [makeCard(SubscriptionType.UNLIMITED_STUDIO, undefined)];
    expect(
      pickRelaxedAllowedModels(
        cards,
        SubscriptionType.UNLIMITED_STUDIO,
        snapshot
      )
    ).toEqual(snapshot);
  });

  it("returns an empty list when neither source has models", () => {
    expect(
      pickRelaxedAllowedModels(undefined, SubscriptionType.UNLIMITED_STUDIO, [])
    ).toEqual([]);
  });

  it("returns the snapshot when subscriptionType is undefined", () => {
    const snapshot = ["gpt_image_2"];
    const cards = [makeCard(SubscriptionType.UNLIMITED_STUDIO, STUDIO_FULL)];
    expect(pickRelaxedAllowedModels(cards, undefined, snapshot)).toEqual(
      snapshot
    );
  });
});
