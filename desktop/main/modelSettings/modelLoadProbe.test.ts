import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runModelProbe } from "./runModelProbe";

describe("standalone ComfyUI component load probe", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "model-load-probe-"));
    for (const folder of ["comfy", "app", "app/assets"]) {
      await mkdir(path.join(root, folder), { recursive: true });
      await writeFile(path.join(root, folder, "__init__.py"), "");
    }
    await writeFile(
      path.join(root, "comfy/options.py"),
      "args_parsing=False\ndef enable_args_parsing():\n    global args_parsing\n    args_parsing=True\n"
    );
    await writeFile(
      path.join(root, "app/assets/manager.py"),
      "def default_asset_manager(): return object()\n"
    );
    await writeFile(
      path.join(root, "folder_paths.py"),
      "def add_model_folder_path(category,folder):\n    assert category=='diffusion_models' and folder.endswith('models')\n"
    );
    await writeFile(
      path.join(root, "comfy/model_management.py"),
      "import json,sys\ndef load_models_gpu(models):\n    assert len(models)==1\n    json.dump({'argv':sys.argv,'loaded':True},open('loaded.json','w'))\ndef unload_all_models(): pass\n"
    );
    await writeFile(
      path.join(root, "nodes.py"),
      `import comfy.options, server
assert comfy.options.args_parsing
async def init_extra_nodes(init_custom_nodes,init_api_nodes):
    assert init_custom_nodes and not init_api_nodes
    assert server.PromptServer.instance is not None
class Patcher:
    model_size=1
    model=type('Model',(),{'model_config':type('QwenImage',(),{})()})()
class Loader:
    FUNCTION='load'
    @classmethod
    def INPUT_TYPES(cls): return {'required':{'unet_name':[['custom.safetensors']], 'weight_dtype':[['default'],{'default':'default'}]}}
    def load(self,unet_name,weight_dtype):
        assert unet_name=='custom.safetensors' and weight_dtype=='default'
        return (Patcher(),)
NODE_CLASS_MAPPINGS={'UNETLoader':Loader}
`
    );
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });
  it.each([true, false])(
    "requires the LoRA to patch the selected base model (matches: %s)",
    async (matches) => {
      await writeFile(
        path.join(root, "server.py"),
        "class PromptServer:\n    instance=None\n    def __init__(self,loop): PromptServer.instance=self\n"
      );
      const nodes = await readFile(path.join(root, "nodes.py"), "utf8");
      await writeFile(
        path.join(root, "nodes.py"),
        nodes +
          `
class LoraLoader:
    FUNCTION='load'
    @classmethod
    def INPUT_TYPES(cls): return {'required':{'model':('MODEL',),'lora_name':[['rank4.safetensors']]}}
    def load(self,model,lora_name):
        assert isinstance(model,Patcher)
        assert lora_name=='rank4.safetensors'
        model.patches=${matches ? "{'layer': ['rank4 patch']}" : "{}"}
        return (model,)
NODE_CLASS_MAPPINGS['LoraLoaderModelOnly']=LoraLoader
`
      );
      const result = await runModelProbe("python", {
        action: "load",
        model: "qwen-image",
        role: "lora",
        root,
        loader: "LoraLoaderModelOnly",
        inputs: { lora_name: "rank4.safetensors" },
        baseLoader: "UNETLoader",
        baseInputs: { unet_name: "custom.safetensors" }
      });
      expect(result.status).toBe(matches ? "success" : "error");
      if (!matches) expect(result.message).toContain("did not match");
    }
  );
  it.each(["legacy", "asset-manager"])(
    "initializes %s custom-node context before loading and allocating the component",
    async (kind) => {
      await writeFile(
        path.join(root, "server.py"),
        `class PromptServer:\n    instance=None\n    def __init__(self,loop${kind === "asset-manager" ? ",asset_manager" : ""}):\n        PromptServer.instance=self\n`
      );
      const result = await runModelProbe("python", {
        action: "load",
        model: "qwen-image",
        role: "main",
        root,
        loader: "UNETLoader",
        inputs: { unet_name: "custom.safetensors" },
        categories: { diffusion_models: [path.join(root, "models")] },
        memoryPolicy: "low-vram"
      });
      expect(result.status).toBe("success");
      const allocation = JSON.parse(
        await readFile(path.join(root, "loaded.json"), "utf8")
      );
      expect(allocation).toMatchObject({ loaded: true });
      expect(allocation.argv).toContain("--lowvram");
    }
  );
});
