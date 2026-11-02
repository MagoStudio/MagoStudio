import { describe, expect, it, vi } from "vitest";

describe("backendApiClient credential barrier", () => {
  it("lets the UI initialize while holding cloud requests until the API key arrives", async () => {
    vi.resetModules();
    const { backendApiClient, initializeBackendApiClient, setApiKey } =
      await import("./backend-api-client");
    const getToken = vi.fn().mockResolvedValue("clerk-token");
    initializeBackendApiClient(getToken, { waitForApiKey: true });

    let adapterCalled = false;
    const request = backendApiClient.get("/projects", {
      adapter: async (config) => {
        adapterCalled = true;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }
    });
    await Promise.resolve();
    expect(adapterCalled).toBe(false);

    setApiKey("local-api-key");
    const response = await request;

    expect(adapterCalled).toBe(true);
    expect(response.config.headers.Authorization).toBe("Bearer clerk-token");
    expect(response.config.headers["X-API-Key"]).toBe("local-api-key");
  });
});
