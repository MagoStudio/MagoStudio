import { describe, expect, it } from "vitest";

import {
  BalanceSchema,
  RelaxedModeType,
  SubscriptionFeatures
} from "@/schemas/balance";

const baseSubscription = {
  id: "sub-1",
  price_id: "price-1",
  price_amount: 1000,
  price_currency: "usd",
  credits: 60000,
  current_period_end: 9999999999,
  current_period_start: 1,
  cancel_at_period_end: false,
  features: {},
  schedule: {},
  status: "active" as const
};

const baseBalance = {
  amount: 1750,
  reserved_amount: 0,
  latest_subscription: baseSubscription,
  renders_in_progress: {
    credits: {
      img2img: 0,
      img2img_ids: [],
      last_img2img_render_at: 0,
      video: 0,
      video_ids: []
    },
    unlimited: {
      img2img: 0,
      img2img_ids: [],
      last_img2img_render_at: 0,
      video: 0,
      video_ids: []
    }
  }
};

describe("SubscriptionFeatures relaxed fields", () => {
  it("parses relaxed_mode_type 'unlimited' with an explicit allow-all list", () => {
    const result = SubscriptionFeatures.safeParse({
      relaxed_mode_type: RelaxedModeType.UNLIMITED,
      relaxed_allowed_models: [
        "v2.5.0",
        "v3.4.0",
        "v5.0.0",
        "kling_o1",
        "seedance_2",
        "happy_horse_1",
        "gpt_image_2",
        "nanobanana_pro"
      ]
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_mode_type).toBe("unlimited");
    expect(result.data?.relaxed_allowed_models).toHaveLength(8);
  });

  it("parses relaxed_mode_type 'relaxed' with a restricted engine_version + render_model list", () => {
    const result = SubscriptionFeatures.safeParse({
      relaxed_mode_type: RelaxedModeType.RELAXED,
      relaxed_allowed_models: ["v5.0.0", "kling_o1", "gpt_image_2"]
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_allowed_models).toEqual([
      "v5.0.0",
      "kling_o1",
      "gpt_image_2"
    ]);
  });

  it("parses relaxed_allowed_models as an empty list (deny-all)", () => {
    const result = SubscriptionFeatures.safeParse({
      relaxed_mode_type: RelaxedModeType.RELAXED,
      relaxed_allowed_models: []
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_allowed_models).toEqual([]);
  });

  it("parses when relaxed fields are absent (free tier)", () => {
    const result = SubscriptionFeatures.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_mode_type).toBeUndefined();
    expect(result.data?.relaxed_allowed_models).toBeUndefined();
  });

  it("rejects relaxed_allowed_models: null (no longer nullable)", () => {
    const result = SubscriptionFeatures.safeParse({
      relaxed_mode_type: RelaxedModeType.RELAXED,
      relaxed_allowed_models: null
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown relaxed_mode_type", () => {
    const result = SubscriptionFeatures.safeParse({
      relaxed_mode_type: "turbo"
    });
    expect(result.success).toBe(false);
  });
});

describe("BalanceSchema relaxed_usage", () => {
  it("parses relaxed_usage: null (uncapped)", () => {
    const result = BalanceSchema.safeParse({
      ...baseBalance,
      relaxed_usage: null
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_usage).toBeNull();
  });

  it("parses relaxed_usage with daily fields only", () => {
    const result = BalanceSchema.safeParse({
      ...baseBalance,
      relaxed_usage: { day_used_pct: 42.5, day_reset_at: 1750000000 }
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_usage?.day_used_pct).toBe(42.5);
    expect(result.data?.relaxed_usage?.week_used_pct).toBeUndefined();
  });

  it("parses relaxed_usage with both daily and weekly fields", () => {
    const result = BalanceSchema.safeParse({
      ...baseBalance,
      relaxed_usage: {
        day_used_pct: 80,
        week_used_pct: 55,
        day_reset_at: 1750000000,
        week_reset_at: 1750500000
      }
    });
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_usage?.week_used_pct).toBe(55);
  });

  it("parses when relaxed_usage is absent", () => {
    const result = BalanceSchema.safeParse(baseBalance);
    expect(result.success).toBe(true);
    expect(result.data?.relaxed_usage).toBeUndefined();
  });
});
