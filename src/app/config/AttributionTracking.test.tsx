import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AttributionTracking } from "./AttributionTracking";

const clerk = vi.hoisted(() => {
  const update = vi.fn(async () => undefined);
  const updateMetadata = vi.fn(async () => undefined);
  const getSessions = vi.fn(async () => [] as unknown[]);
  const user = {
    unsafeMetadata: {} as Record<string, unknown>,
    update,
    updateMetadata,
    getSessions
  };
  return {
    update,
    updateMetadata,
    getSessions,
    user,
    isLoaded: true,
    sessionId: "sess_current" as string | undefined
  };
});

vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({ user: clerk.user, isLoaded: clerk.isLoaded }),
  useSession: () => ({ session: { id: clerk.sessionId } })
}));

const UTM_STORAGE_KEY = "utm_pending";

const pendingUtm = {
  utm_source: "newsletter",
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  clerk.update.mockClear();
  clerk.updateMetadata.mockClear();
  clerk.updateMetadata.mockResolvedValue(undefined);
  clerk.getSessions.mockReset();
  clerk.getSessions.mockResolvedValue([
    { id: "sess_current", latestActivity: { country: "US" } }
  ]);
  clerk.user.unsafeMetadata = {};
  clerk.isLoaded = true;
  clerk.sessionId = "sess_current";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AttributionTracking", () => {
  test("stashes utm parsed from the landing URL on mount", async () => {
    window.history.replaceState({}, "", "/?utm_source=newsletter");
    clerk.isLoaded = false;

    render(<AttributionTracking />);

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) ?? "null")
      ).toEqual(pendingUtm);
    });
    expect(clerk.updateMetadata).not.toHaveBeenCalled();
  });

  test("flushes pending utm and session country into unsafeMetadata, then clears storage", async () => {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(pendingUtm));

    render(<AttributionTracking />);

    await waitFor(() => {
      expect(clerk.updateMetadata).toHaveBeenCalledWith({
        unsafeMetadata: { utm: pendingUtm, country: "US" }
      });
    });
    expect(localStorage.getItem(UTM_STORAGE_KEY)).toBeNull();
  });

  test("skips the session lookup when a country is already stored", async () => {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(pendingUtm));
    clerk.user.unsafeMetadata = { country: "FR" };

    render(<AttributionTracking />);

    await waitFor(() => {
      expect(clerk.updateMetadata).toHaveBeenCalledWith({
        unsafeMetadata: { utm: pendingUtm }
      });
    });
    expect(clerk.getSessions).not.toHaveBeenCalled();
  });

  test("writes nothing when there is no pending utm and no country to add", async () => {
    clerk.user.unsafeMetadata = { country: "US" };

    render(<AttributionTracking />);

    await waitFor(() => expect(clerk.getSessions).not.toHaveBeenCalled());
    expect(clerk.updateMetadata).not.toHaveBeenCalled();
    expect(clerk.update).not.toHaveBeenCalled();
  });

  test("clears an invalid pending utm entry instead of reprocessing it", async () => {
    localStorage.setItem(UTM_STORAGE_KEY, '{"evil":"x"}');
    clerk.user.unsafeMetadata = { country: "US" };

    render(<AttributionTracking />);

    await waitFor(() =>
      expect(localStorage.getItem(UTM_STORAGE_KEY)).toBeNull()
    );
    expect(clerk.updateMetadata).not.toHaveBeenCalled();
  });

  test("does not flush until the Clerk user is loaded", async () => {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(pendingUtm));
    clerk.isLoaded = false;

    render(<AttributionTracking />);

    await waitFor(() => expect(clerk.updateMetadata).not.toHaveBeenCalled());
    expect(localStorage.getItem(UTM_STORAGE_KEY)).not.toBeNull();
  });
});
