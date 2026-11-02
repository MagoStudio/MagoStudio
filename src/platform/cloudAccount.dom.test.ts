import { afterEach, describe, expect, it, vi } from "vitest";

import { isCloudAccountActive, openExternalUrl } from "./cloudAccount";

const setBridge = (value: unknown) => {
  Object.defineProperty(window, "mago", {
    value,
    configurable: true,
    writable: true
  });
};

afterEach(() => {
  setBridge(undefined);
  vi.restoreAllMocks();
});

describe("isCloudAccountActive", () => {
  it("is active outside the desktop shell, where there is always an account", () => {
    // The cloud web app, unit tests and Storybook all land here.
    setBridge(undefined);
    expect(isCloudAccountActive()).toBe(true);
  });

  it("follows the window mode inside the desktop shell", () => {
    setBridge({ account: { mode: "cloud" } });
    expect(isCloudAccountActive()).toBe(true);

    setBridge({ account: { mode: "offline" } });
    expect(isCloudAccountActive()).toBe(false);

    setBridge({ account: { mode: "unchosen" } });
    expect(isCloudAccountActive()).toBe(false);
  });
});

describe("openExternalUrl", () => {
  it("hands the URL to the system browser in the desktop app", () => {
    // Stripe blocks embedded webviews, and window.open reaches the main process,
    // which opens it externally and refuses to make a window.
    const open = vi.fn();
    setBridge({ account: { mode: "cloud" } });
    vi.stubGlobal("open", open);

    openExternalUrl("https://checkout.stripe.com/pay/abc");

    expect(open).toHaveBeenCalledWith(
      "https://checkout.stripe.com/pay/abc",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("navigates normally on the web", () => {
    const assign = vi.fn();
    setBridge(undefined);
    Object.defineProperty(window, "location", {
      value: { assign },
      configurable: true,
      writable: true
    });

    openExternalUrl("https://checkout.stripe.com/pay/abc");

    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/pay/abc");
  });

  it("refuses anything that is not an https URL", () => {
    const open = vi.fn();
    setBridge({ account: { mode: "cloud" } });
    vi.stubGlobal("open", open);

    for (const url of [
      "http://checkout.stripe.com/pay",
      "javascript:alert(1)",
      "file:///C:/Windows",
      "not a url",
      ""
    ]) {
      openExternalUrl(url);
    }

    expect(open).not.toHaveBeenCalled();
  });
});
