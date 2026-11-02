import { describe, expect, it } from "vitest";

import {
  appendMutationRecord,
  extractStackTop,
  HistoryMutationRecord,
  MAX_HISTORY_MUTATION_RECORDS,
  parseMutationLog,
  serializeMutationLog
} from "./historyMutationLog";

const record = (url: string): HistoryMutationRecord => ({
  method: "pushState",
  url,
  stackTop: "at app"
});

describe("extractStackTop", () => {
  it("returns 'unknown' when there is no stack", () => {
    expect(extractStackTop(undefined)).toBe("unknown");
  });

  it("skips the observer's own frames and returns the first real caller", () => {
    const stack = [
      "Error",
      "    at installHistoryMutationObserver (historyMutationLog.ts:1:1)",
      "    at appendMutationRecord (historyMutationLog.ts:2:2)",
      "    at handler (https://r.wdfl.co/rw.js:1:23)",
      "    at onload (https://app.mago.studio/project:5:5)"
    ].join("\n");
    expect(extractStackTop(stack)).toBe(
      "at handler (https://r.wdfl.co/rw.js:1:23)"
    );
  });
});

describe("appendMutationRecord", () => {
  it("keeps only the most recent MAX records", () => {
    let buffer: HistoryMutationRecord[] = [];
    for (let i = 0; i < MAX_HISTORY_MUTATION_RECORDS + 5; i++) {
      buffer = appendMutationRecord(buffer, record(`/p/${i}`));
    }
    expect(buffer).toHaveLength(MAX_HISTORY_MUTATION_RECORDS);
    expect(buffer[0]?.url).toBe("/p/5");
    expect(buffer.at(-1)?.url).toBe(`/p/${MAX_HISTORY_MUTATION_RECORDS + 4}`);
  });
});

describe("parseMutationLog / serializeMutationLog", () => {
  it("round-trips a buffer", () => {
    const buffer = [record("/a"), record("/b")];
    expect(parseMutationLog(serializeMutationLog(buffer))).toEqual(buffer);
  });

  it("returns [] for null or malformed input", () => {
    expect(parseMutationLog(null)).toEqual([]);
    expect(parseMutationLog("{not json")).toEqual([]);
    expect(parseMutationLog('"a string"')).toEqual([]);
  });
});
