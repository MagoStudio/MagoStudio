import { describe, expect, it } from "vitest";

import { parseDragPayloadIds } from "./parseDragPayloadIds";

const textItem = (json: string) => ({
  kind: "text",
  types: new Set(["text/json"]),
  getText: () => Promise.resolve(json)
});

describe("parseDragPayloadIds", () => {
  it("parses a multi-id payload", async () => {
    const ids = await parseDragPayloadIds([
      textItem(JSON.stringify({ ids: ["a", "b"] }))
    ]);
    expect(ids).toEqual(["a", "b"]);
  });

  it("falls back to a single legacy `id` payload", async () => {
    const ids = await parseDragPayloadIds([
      textItem(JSON.stringify({ id: "only" }))
    ]);
    expect(ids).toEqual(["only"]);
  });

  it("returns an empty array when there are no text items", async () => {
    const ids = await parseDragPayloadIds([
      { kind: "file", types: new Set(["application/octet-stream"]) }
    ]);
    expect(ids).toEqual([]);
  });

  it("returns an empty array when payload is invalid JSON", async () => {
    const ids = await parseDragPayloadIds([textItem("not-json")]);
    expect(ids).toEqual([]);
  });

  it("returns an empty array when payload has neither ids nor id", async () => {
    const ids = await parseDragPayloadIds([textItem(JSON.stringify({}))]);
    expect(ids).toEqual([]);
  });

  it("filters non-string entries from the ids array", async () => {
    const ids = await parseDragPayloadIds([
      textItem(JSON.stringify({ ids: ["a", 42, null, "b"] }))
    ]);
    expect(ids).toEqual(["a", "b"]);
  });

  it("ignores items that don't carry text/json", async () => {
    const ids = await parseDragPayloadIds([
      { kind: "text", types: new Set(["text/plain"]) }
    ]);
    expect(ids).toEqual([]);
  });
});
