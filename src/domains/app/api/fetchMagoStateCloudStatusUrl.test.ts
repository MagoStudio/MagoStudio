import { afterEach, describe, expect, it, vi } from "vitest";

import desktopCloudConfig from "../../../../desktop/shared/cloud.json";

import { fetchMagoState } from "./fetchMagoState";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMagoState in the desktop app", () => {
  it("reads the cloud status URL that the desktop CSP allows", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ "release-ongoing": false, version: "1" })
      } as Response)
    );
    vi.stubGlobal("fetch", fetchSpy);

    await fetchMagoState();

    expect(fetchSpy).toHaveBeenCalledWith(
      desktopCloudConfig.cloudStatusUrl,
      expect.anything()
    );
  });
});
