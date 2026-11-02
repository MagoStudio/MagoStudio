import { describe, expect, it } from "vitest";

import { parseAllowedCloudStorageUrl } from "./parseAllowedCloudStorageUrl";

const ALLOWED_HOSTS = [
  "mago-s3-prod.s3.eu-north-1.amazonaws.com",
  "mago-s3-prod.s3.amazonaws.com"
];

describe("parseAllowedCloudStorageUrl", () => {
  it("accepts a presigned URL on an allowed bucket host", () => {
    const url = parseAllowedCloudStorageUrl(
      "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/a/images.zip?X-Amz-Signature=abc",
      ALLOWED_HOSTS
    );

    expect(url.hostname).toBe("mago-s3-prod.s3.eu-north-1.amazonaws.com");
    expect(url.searchParams.get("X-Amz-Signature")).toBe("abc");
  });

  it("compares hosts case-insensitively", () => {
    expect(
      parseAllowedCloudStorageUrl(
        "https://MAGO-S3-PROD.s3.amazonaws.com/a.png",
        ALLOWED_HOSTS
      ).hostname
    ).toBe("mago-s3-prod.s3.amazonaws.com");
  });

  it.each([
    ["another bucket", "https://someone-else.s3.amazonaws.com/a.png"],
    [
      "a lookalike suffix",
      "https://mago-s3-prod.s3.amazonaws.com.evil.example/a"
    ],
    ["a lookalike prefix", "https://evil-mago-s3-prod.s3.amazonaws.com/a"],
    ["a trailing-dot host", "https://mago-s3-prod.s3.amazonaws.com./a"],
    ["plain http", "http://mago-s3-prod.s3.amazonaws.com/a.png"],
    ["a custom port", "https://mago-s3-prod.s3.amazonaws.com:8443/a.png"],
    [
      "embedded credentials",
      "https://user:pass@mago-s3-prod.s3.amazonaws.com/a"
    ],
    ["loopback", "https://127.0.0.1/a.png"],
    ["the backend", "https://app.mago.studio/api/v02/assets"],
    ["a file URL", "file:///C:/Windows/win.ini"],
    ["a different scheme", "mago-media://asset/asset-1"],
    ["garbage", "not a url"],
    ["an empty string", ""]
  ])("refuses %s", (_label, value) => {
    expect(() => parseAllowedCloudStorageUrl(value, ALLOWED_HOSTS)).toThrow();
  });

  it("refuses anything that is not a string", () => {
    expect(() =>
      parseAllowedCloudStorageUrl(undefined, ALLOWED_HOSTS)
    ).toThrow();
    expect(() =>
      parseAllowedCloudStorageUrl({ href: "https://x" }, ALLOWED_HOSTS)
    ).toThrow();
  });

  it("refuses everything when no host is configured", () => {
    expect(() =>
      parseAllowedCloudStorageUrl("https://mago-s3-prod.s3.amazonaws.com/a", [])
    ).toThrow();
  });
});
