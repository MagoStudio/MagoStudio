import { describe, expect, it } from "vitest";

import { sanitizeDownloadFilename } from "./sanitizeDownloadFilename";

describe("sanitizeDownloadFilename", () => {
  it("leaves an already-safe name untouched", () => {
    expect(sanitizeDownloadFilename("My Project")).toBe("My Project");
  });

  it("replaces path separators so no directory boundary survives", () => {
    expect(sanitizeDownloadFilename("etc/passwd")).toBe("etc_passwd");
    expect(sanitizeDownloadFilename("a\\b")).toBe("a_b");
  });

  it("replaces reserved filesystem characters", () => {
    expect(sanitizeDownloadFilename('a:b*c?d"e<f>g|h')).toBe("a_b_c_d_e_f_g_h");
  });

  it("replaces control characters", () => {
    expect(sanitizeDownloadFilename("before\nafter")).toBe("before_after");
  });

  it("strips bidi override and isolate control characters", () => {
    expect(sanitizeDownloadFilename("evil\u202Etxt.exe")).toBe("eviltxt.exe");
    expect(sanitizeDownloadFilename("\u2066isolated\u2069")).toBe("isolated");
  });

  it("strips leading dots", () => {
    expect(sanitizeDownloadFilename("...hidden")).toBe("hidden");
  });

  it("clamps a plain-ASCII segment to 100 bytes", () => {
    const longName = "a".repeat(250);

    const sanitized = sanitizeDownloadFilename(longName);

    expect(sanitized).toHaveLength(100);
    expect(sanitized).toBe("a".repeat(100));
  });

  it("clamps astral characters (emoji) to a byte budget without splitting a surrogate pair", () => {
    const clapperBoard = "\u{1F3AC}";
    const longName = clapperBoard.repeat(40);

    const sanitized = sanitizeDownloadFilename(longName);

    const byteLength = new TextEncoder().encode(sanitized).length;
    expect(byteLength).toBeLessThanOrEqual(100);
    expect(sanitized.length % 2).toBe(0);
    expect(Array.from(sanitized).every((char) => char === clapperBoard)).toBe(
      true
    );
  });

  it("clamps CJK characters (3 bytes each in UTF-8) to the byte budget, not the character count", () => {
    const cjkCharacter = "測";
    const longName = cjkCharacter.repeat(50);

    const sanitized = sanitizeDownloadFilename(longName);

    const byteLength = new TextEncoder().encode(sanitized).length;
    expect(byteLength).toBeLessThanOrEqual(100);
    expect(sanitized.length).toBeLessThan(50);
  });

  it("prefixes an underscore onto a Windows-reserved device name", () => {
    expect(sanitizeDownloadFilename("CON")).toBe("_CON");
    expect(sanitizeDownloadFilename("con")).toBe("_con");
    expect(sanitizeDownloadFilename("COM1")).toBe("_COM1");
    expect(sanitizeDownloadFilename("lpt9")).toBe("_lpt9");
    expect(sanitizeDownloadFilename("NUL")).toBe("_NUL");
  });

  it("leaves a name that merely contains a reserved word untouched", () => {
    expect(sanitizeDownloadFilename("CONcert")).toBe("CONcert");
    expect(sanitizeDownloadFilename("My CON Project")).toBe("My CON Project");
  });
});
