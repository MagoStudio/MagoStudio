import { describe, expect, it } from "vitest";

import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";
import { minimaxReferenceVideoModel } from "../minimaxReferenceVideoModel";

import { doesModelDeclareSettingKey } from "./doesModelDeclareSettingKey";

describe("doesModelDeclareSettingKey", () => {
  it("finds a key declared as a setting", () => {
    expect(
      doesModelDeclareSettingKey(minimaxReferenceVideoModel, "prompt")
    ).toBe(true);
  });

  it("finds a key declared only as an extra key", () => {
    expect(
      doesModelDeclareSettingKey(minimaxReferenceVideoModel, "save_exr")
    ).toBe(true);
  });

  it("does not find a key the model never declares", () => {
    expect(
      doesModelDeclareSettingKey(minimaxReferenceVideoModel, "negative_prompt")
    ).toBe(false);
  });

  it("finds negative_prompt on a model that declares it as a hidden setting", () => {
    expect(
      doesModelDeclareSettingKey(magoV5_0_0RenderModel, "negative_prompt")
    ).toBe(true);
  });
});
