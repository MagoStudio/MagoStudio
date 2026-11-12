import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runModelProbe } from "./runModelProbe";

describe("native model header probe", () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "model-header-"));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });
  const integer = (value: number, size: 4 | 8) => {
    const b = Buffer.alloc(size);
    if (size === 8) b.writeBigUInt64LE(BigInt(value));
    else b.writeUInt32LE(value);
    return b;
  };
  const string = (value: string) =>
    Buffer.concat([integer(Buffer.byteLength(value), 8), Buffer.from(value)]);
  const gguf = (width: number, blocks = 64, predictionLayers = 0) =>
    Buffer.concat([
      Buffer.from("GGUF"),
      integer(3, 4),
      integer(1, 8),
      integer(4, 8),
      string("general.architecture"),
      integer(8, 4),
      string("qwen35"),
      string("qwen35.embedding_length"),
      integer(4, 4),
      integer(width, 4),
      string("qwen35.block_count"),
      integer(4, 4),
      integer(blocks, 4),
      string("qwen35.nextn_predict_layers"),
      integer(4, 4),
      integer(predictionLayers, 4),
      string("blk.0.attn_norm.weight"),
      integer(1, 4),
      integer(width, 8),
      integer(0, 4),
      integer(0, 8),
      Buffer.alloc(width * 4)
    ]);
  const safetensors = (width: number, prefix = "") => {
    const header = Buffer.from(
      JSON.stringify({
        [prefix + "norm.weight"]: {
          dtype: "F32",
          shape: [width],
          data_offsets: [0, width * 4]
        }
      })
    );
    return Buffer.concat([
      integer(header.length, 8),
      header,
      Buffer.alloc(width * 4)
    ]);
  };
  it("accepts the supported Qwen architecture and rejects the wrong embedding shape", async () => {
    const file = path.join(directory, "model.gguf");
    await writeFile(file, gguf(5120));
    expect(
      (
        await runModelProbe("python", {
          action: "compatibility",
          model: "text",
          path: file
        })
      ).status
    ).toBe("success");
    await writeFile(file, gguf(4096));
    const wrong = await runModelProbe("python", {
      action: "compatibility",
      model: "text",
      path: file
    });
    expect(wrong.status).toBe("mismatch");
    expect(wrong.message).toContain("5120");
  });
  it.each([
    [65, 1, "success"],
    [65, 0, "mismatch"],
    [64, 1, "mismatch"],
    [32, 0, "mismatch"]
  ] as const)(
    "checks %s total layers with %s prediction layers",
    async (blocks, predictionLayers, expected) => {
      const file = path.join(directory, "qwen.gguf");
      await writeFile(file, gguf(5120, blocks, predictionLayers));
      const result = await runModelProbe("python", {
        action: "compatibility",
        model: "text",
        path: file
      });
      expect(result.status).toBe(expected);
    }
  );
  it("compares actual safetensors dimensions without loading weights into a GPU", async () => {
    const reference = path.join(directory, "recommended.safetensors"),
      candidate = path.join(directory, "custom.safetensors");
    await writeFile(reference, safetensors(8));
    await writeFile(candidate, safetensors(16));
    const mismatch = await runModelProbe("python", {
      action: "compatibility",
      model: "minimax",
      path: candidate,
      reference
    });
    expect(mismatch.status).toBe("mismatch");
    expect(mismatch.details?.mismatches).toEqual([
      { tensor: "norm.weight", expected: [8], actual: [16] }
    ]);
    await writeFile(candidate, safetensors(8));
    expect(
      (
        await runModelProbe("python", {
          action: "compatibility",
          model: "minimax",
          path: candidate,
          reference
        })
      ).status
    ).toBe("success");
  });
  it.each([false, true])(
    "compares MiniMax checkpoint namespaces in either direction (prefixed reference: %s)",
    async (prefixedReference) => {
      const reference = path.join(directory, "recommended.safetensors");
      const candidate = path.join(directory, "singularity.safetensors");
      const prefix = "model.diffusion_model.";
      await writeFile(
        reference,
        safetensors(8, prefixedReference ? prefix : "")
      );
      await writeFile(
        candidate,
        safetensors(8, prefixedReference ? "" : prefix)
      );
      const request = {
        action: "compatibility",
        model: "minimax",
        role: "main",
        path: candidate,
        reference
      };
      const matched = await runModelProbe("python", request);
      expect(matched.status).toBe("success");
      expect(matched.details?.comparedTensors).toBe(1);
      await writeFile(
        candidate,
        safetensors(16, prefixedReference ? "" : prefix)
      );
      const mismatch = await runModelProbe("python", request);
      expect(mismatch.status).toBe("mismatch");
      expect(mismatch.details?.mismatches).toEqual([
        { tensor: "norm.weight", expected: [8], actual: [16] }
      ]);
    }
  );
  it("does not strip diffusion namespaces from other components", async () => {
    const reference = path.join(directory, "recommended.safetensors");
    const candidate = path.join(directory, "wrong-component.safetensors");
    await writeFile(reference, safetensors(8));
    await writeFile(candidate, safetensors(8, "model.diffusion_model."));
    const result = await runModelProbe("python", {
      action: "compatibility",
      model: "minimax",
      role: "encoder",
      path: candidate,
      reference
    });
    expect(result.status).toBe("mismatch");
  });
  it("reports corrupt headers as file errors rather than GPU memory failures", async () => {
    const file = path.join(directory, "broken.gguf");
    await writeFile(file, "GGUF");
    const result = await runModelProbe("python", {
      action: "compatibility",
      model: "text",
      path: file
    });
    expect(result.status).toBe("error");
    expect(result.details?.kind).toBe("load-failure");
    expect(result.message).toContain("Truncated");
  });
  it("defers LoRAs with different ranks to the base-model load test", async () => {
    const lora = (rank: number) => {
      const bytes = rank * 8 * 4;
      const header = Buffer.from(
        JSON.stringify({
          "layer.lora_up.weight": {
            dtype: "F32",
            shape: [8, rank],
            data_offsets: [0, bytes]
          },
          "layer.lora_down.weight": {
            dtype: "F32",
            shape: [rank, 8],
            data_offsets: [bytes, bytes * 2]
          }
        })
      );
      return Buffer.concat([
        integer(header.length, 8),
        header,
        Buffer.alloc(bytes * 2)
      ]);
    };
    const reference = path.join(directory, "recommended.safetensors");
    const candidate = path.join(directory, "custom.safetensors");
    await writeFile(reference, lora(2));
    await writeFile(candidate, lora(4));
    const result = await runModelProbe("python", {
      action: "compatibility",
      model: "minimax",
      role: "lora",
      path: candidate,
      reference
    });
    expect(result.status).toBe("unknown");
    expect(result.message).toContain("selected base model");
    await writeFile(candidate, lora(4).subarray(0, 50));
    expect(
      (
        await runModelProbe("python", {
          action: "compatibility",
          model: "minimax",
          role: "lora",
          path: candidate,
          reference
        })
      ).status
    ).toBe("error");
  });
  it("rejects a valid safetensors header whose weights are truncated", async () => {
    const file = path.join(directory, "truncated.safetensors");
    const bytes = safetensors(16);
    await writeFile(file, bytes.subarray(0, bytes.length - 32));
    const result = await runModelProbe("python", {
      action: "compatibility",
      model: "minimax",
      path: file,
      reference: file
    });
    expect(result.status).toBe("error");
    expect(result.message).toContain("Truncated");
  });

  it("loads llama.cpp's GPU backend plug-ins before asking for GPU support", async () => {
    const packageDirectory = path.join(directory, "llama_cpp");
    await mkdir(path.join(packageDirectory, "lib"), { recursive: true });
    await writeFile(
      path.join(packageDirectory, "__init__.py"),
      `__version__='0.4.1'
_backends_loaded=False
def ggml_backend_load_all_from_path(path):
    global _backends_loaded
    _backends_loaded=path.endswith(b'lib')
def llama_backend_init(): pass
def llama_supports_gpu_offload(): return _backends_loaded
def llama_print_system_info(): return b'CUDA : ARCHS = 1200'
`
    );
    const previousPythonPath = process.env.PYTHONPATH;
    process.env.PYTHONPATH = directory;
    try {
      const result = await runModelProbe("python", { action: "runtime" });
      expect(result.details).toMatchObject({
        llamaVersion: "0.4.1",
        llamaGpu: true
      });
    } finally {
      if (previousPythonPath === undefined) delete process.env.PYTHONPATH;
      else process.env.PYTHONPATH = previousPythonPath;
    }
  });
});
