import { describe, expect, it, vi } from "vitest";

import { findListeningProcessId } from "./findListeningProcessId";

const NETSTAT_OUTPUT = `
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1160
  TCP    127.0.0.1:8188         127.0.0.1:51234        ESTABLISHED     9001
  TCP    127.0.0.1:8188         0.0.0.0:0              LISTENING       4242
  TCP    127.0.0.1:18188        0.0.0.0:0              LISTENING       7777
  TCP    [::1]:9188             [::]:0                 LISTENING       5555
  UDP    0.0.0.0:7100           *:*                                    3333
`;

describe("findListeningProcessId", () => {
  it("returns the process listening on the exact port", async () => {
    await expect(
      findListeningProcessId(8188, vi.fn().mockResolvedValue(NETSTAT_OUTPUT))
    ).resolves.toBe(4242);
  });

  it("finds a process listening on an IPv6 address", async () => {
    await expect(
      findListeningProcessId(9188, vi.fn().mockResolvedValue(NETSTAT_OUTPUT))
    ).resolves.toBe(5555);
  });

  it("returns null when nothing listens on the port or netstat fails", async () => {
    await expect(
      findListeningProcessId(9999, vi.fn().mockResolvedValue(NETSTAT_OUTPUT))
    ).resolves.toBeNull();
    await expect(
      findListeningProcessId(8188, vi.fn().mockRejectedValue(new Error("no")))
    ).resolves.toBeNull();
  });
});
