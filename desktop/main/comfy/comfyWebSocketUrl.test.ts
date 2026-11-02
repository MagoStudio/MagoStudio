import { describe, expect, it } from "vitest";

import { comfyWebSocketUrl } from "./comfyWebSocketUrl";

describe("comfyWebSocketUrl", () => {
  it("maps http to ws and appends the socket path and client id", () => {
    expect(comfyWebSocketUrl("http://127.0.0.1:8188", "mago-1")).toBe(
      "ws://127.0.0.1:8188/ws?clientId=mago-1"
    );
  });

  it("maps https to wss and keeps a path prefix", () => {
    expect(comfyWebSocketUrl("https://comfy.example/api", "mago-1")).toBe(
      "wss://comfy.example/api/ws?clientId=mago-1"
    );
  });
});
