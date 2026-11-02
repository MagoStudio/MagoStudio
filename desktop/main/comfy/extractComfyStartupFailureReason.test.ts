import { describe, expect, it } from "vitest";

import { extractComfyStartupFailureReason } from "./extractComfyStartupFailureReason";

const traceback = (finalLine: string) =>
  [
    "Total VRAM 0 MB, total RAM 32561 MB",
    "Traceback (most recent call last):",
    '  File "C:\\ComfyUI_windows_portable\\ComfyUI\\main.py", line 132, in <module>',
    "    import execution",
    '  File "C:\\ComfyUI_windows_portable\\python_embeded\\Lib\\site-packages\\torch\\cuda\\__init__.py", line 319, in _lazy_init',
    "    torch._C._cuda_init()",
    finalLine,
    "",
    "Press any key to continue . . ."
  ].join("\r\n");

describe("extractComfyStartupFailureReason", () => {
  it("returns the message of the final Python exception", () => {
    expect(
      extractComfyStartupFailureReason(
        traceback(
          "RuntimeError: Found no NVIDIA driver on your system. Please check that you have an NVIDIA GPU and installed a driver."
        )
      )
    ).toBe(
      "Found no NVIDIA driver on your system. Please check that you have an NVIDIA GPU and installed a driver."
    );
  });

  it("accepts qualified exception names", () => {
    expect(
      extractComfyStartupFailureReason(
        traceback(
          "torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB"
        )
      )
    ).toBe("CUDA out of memory. Tried to allocate 2.00 GiB");
  });

  it("uses the last exception when several tracebacks were printed", () => {
    expect(
      extractComfyStartupFailureReason(
        traceback("ImportError: cannot import name 'x' from 'y'") +
          "\n" +
          traceback("AssertionError: Torch not compiled with CUDA enabled")
      )
    ).toBe("Torch not compiled with CUDA enabled");
  });

  it("strips terminal colour codes", () => {
    expect(
      extractComfyStartupFailureReason(
        "\u001b[31mRuntimeError: No CUDA GPUs are available\u001b[0m"
      )
    ).toBe("No CUDA GPUs are available");
  });

  it.each([
    ["a bare token", traceback("KeyError: 'model'")],
    [
      "an overly long dump",
      traceback(`ValueError: ${"tensor value ".repeat(40)}`)
    ],
    [
      "no exception at all",
      "Starting server\nTo see the GUI go to: http://127.0.0.1:8188"
    ],
    ["empty output", ""]
  ])("returns null for %s", (_description, comfyOutput) => {
    expect(extractComfyStartupFailureReason(comfyOutput)).toBeNull();
  });
});
