import { describe, expect, it } from "vitest";

import { createModelSettingsFixture } from "@/stories/fixtures/createModelSettingsFixture";

import { modelSetupStatus } from "./modelSetupStatus";

describe("model selector setup status", () => {
  it("marks a complete model green", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "minimax"
    });
    expect(modelSetupStatus(snapshot)).toBe(true);
  });
  it.each(["main", "lora", "accelerator"])(
    "marks missing required MiniMax %s red",
    async (role) => {
      const snapshot = await createModelSettingsFixture().api.inspect({
        model: "minimax"
      });
      snapshot.components.find((item) => item.role === role)!.status =
        "missing";
      expect(modelSetupStatus(snapshot)).toBe(false);
    }
  );
  it("leaves absent optional models unmarked even when shared encoders are installed", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "qwen-image"
    });
    snapshot.components[0].status = "missing";
    snapshot.loadersAvailable = false;
    expect(modelSetupStatus(snapshot)).toBe(null);
  });
  it("marks an installed optional model with a missing dependency red", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "qwen-image"
    });
    snapshot.components[1].status = "missing";
    expect(modelSetupStatus(snapshot)).toBe(false);
  });
  it("marks an installed model red when a workflow node is missing", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "qwen-image"
    });
    snapshot.missingWorkflowNodes = [
      {
        name: "ModelSamplingAuraFlow",
        url: "https://github.com/Comfy-Org/ComfyUI",
        installKind: "core",
        status: "missing"
      }
    ];
    expect(modelSetupStatus(snapshot)).toBe(false);
  });
  it("marks the text model red when llama.cpp is missing from ComfyUI's Python", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "text"
    });
    snapshot.components.forEach((component) => {
      component.status = "installed";
    });
    snapshot.isLlamaCppPackageInstalled = false;
    expect(modelSetupStatus(snapshot)).toBe(false);
  });
  it("marks failed checks red, but not successful checks", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "text"
    });
    snapshot.components[0].problem = {
      status: "error",
      message: "Load failed"
    };
    expect(modelSetupStatus(snapshot)).toBe(false);
    snapshot.components[0].problem = { status: "success", message: "Loaded" };
    expect(modelSetupStatus(snapshot)).toBe(true);
  });
  it("does not show green while availability is unknown", async () => {
    const snapshot = await createModelSettingsFixture().api.inspect({
      model: "text"
    });
    snapshot.available = false;
    expect(modelSetupStatus(snapshot)).toBe(null);
    snapshot.model = "minimax";
    expect(modelSetupStatus(snapshot)).toBe(false);
    expect(modelSetupStatus()).toBe(null);
  });
});
