import { describe, expect, it } from "vitest";

import {
  formatComfyError,
  formatComfyHttpError,
  isComfyOutOfMemoryError
} from "./comfyError";

describe("ComfyUI error formatting", () => {
  it("explains a missing model file from prompt validation", () => {
    const payload = {
      error: { message: "Prompt outputs failed validation" },
      node_errors: {
        "4": {
          class_type: "UNETLoader",
          errors: [
            {
              type: "value_not_in_list",
              message: "Value not in list",
              details: "unet_name is not available",
              extra_info: {
                input_name: "unet_name",
                received_value: "wan_animate_2_distill_int8_convrot.safetensors"
              }
            }
          ]
        }
      }
    };

    expect(
      formatComfyHttpError(400, "Bad Request", JSON.stringify(payload))
    ).toBe(
      'ComfyUI cannot find model file "wan_animate_2_distill_int8_convrot.safetensors" for UNETLoader. Install it in the expected ComfyUI models folder, then refresh or restart ComfyUI.'
    );
  });

  it("shows missing custom nodes", () => {
    expect(
      formatComfyError({
        error: {
          message:
            "Cannot execute because node WanAnimate2Cache does not exist."
        }
      })
    ).toBe(
      "ComfyUI rejected the workflow: Cannot execute because node WanAnimate2Cache does not exist."
    );
  });

  it("turns execution OOM payloads into actionable text", () => {
    const result = formatComfyError([
      [
        "execution_error",
        {
          node_type: "KSamplerAdvanced",
          exception_type: "torch.OutOfMemoryError",
          exception_message: "CUDA out of memory. Tried to allocate 2 GiB",
          traceback: ["private implementation detail"]
        }
      ]
    ]);

    expect(result).toBe(
      "ComfyUI ran out of GPU memory while running KSamplerAdvanced. Reduce the output size or select a smaller model."
    );
    expect(isComfyOutOfMemoryError(result)).toBe(true);
    expect(result).not.toContain("traceback");
  });

  it("reports the failing node and exception without dumping inputs", () => {
    expect(
      formatComfyError([
        [
          "execution_error",
          {
            node_type: "WanAnimateToVideo",
            exception_message: "Expected 36 channels but got 32",
            current_inputs: { image: "private-path.png" }
          }
        ]
      ])
    ).toBe(
      "ComfyUI failed in WanAnimateToVideo: Expected 36 channels but got 32"
    );
  });
});
