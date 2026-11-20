import { describe, expect, it, vi } from "vitest";

import { retryWhileFileIsLocked } from "./retryWhileFileIsLocked";

const fileSystemError = (code: string): NodeJS.ErrnoException =>
  Object.assign(new Error(code), { code });

describe("retryWhileFileIsLocked", () => {
  it("succeeds once a briefly locked file is released", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(fileSystemError("EBUSY"))
      .mockRejectedValueOnce(fileSystemError("EPERM"))
      .mockResolvedValueOnce("done");
    const wait = vi.fn<(milliseconds: number) => Promise<void>>(async () => {});

    await expect(
      retryWhileFileIsLocked(operation, wait, "win32")
    ).resolves.toBe("done");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[100], [200]]);
  });

  it("throws the last lock error after waiting about five seconds in total", async () => {
    const operation = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(fileSystemError("EBUSY"));
    const wait = vi.fn<(milliseconds: number) => Promise<void>>(async () => {});

    await expect(retryWhileFileIsLocked(operation, wait)).rejects.toThrow(
      "EBUSY"
    );
    const totalWaitedMs = wait.mock.calls.reduce(
      (sum, [milliseconds]) => sum + milliseconds,
      0
    );
    expect(totalWaitedMs).toBe(5000);
  });

  it("fails at once on an error that is not a lock", async () => {
    const operation = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(fileSystemError("ENOENT"));
    const wait = vi.fn<(milliseconds: number) => Promise<void>>(async () => {});

    await expect(retryWhileFileIsLocked(operation, wait)).rejects.toThrow(
      "ENOENT"
    );
    expect(operation).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });

  it("treats a permission error outside Windows as a real permission error", async () => {
    const operation = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(fileSystemError("EACCES"));
    const wait = vi.fn<(milliseconds: number) => Promise<void>>(async () => {});

    await expect(
      retryWhileFileIsLocked(operation, wait, "darwin")
    ).rejects.toThrow("EACCES");
    expect(operation).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });
});
