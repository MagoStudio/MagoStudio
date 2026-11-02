interface DropItemLike {
  kind: string;
  types: Set<string>;
  getText?: (type: string) => Promise<string>;
}

export const parseDragPayloadIds = async (
  items: ReadonlyArray<DropItemLike>
): Promise<string[]> => {
  const payloads = await Promise.all(
    items
      .filter((item) => item.kind === "text" && item.types.has("text/json"))
      .map((item) => item.getText?.("text/json") ?? Promise.resolve(""))
  );
  if (payloads.length === 0) return [];
  try {
    const parsed = JSON.parse(payloads[0]);
    if (Array.isArray(parsed.ids))
      return parsed.ids.filter(
        (id: unknown): id is string => typeof id === "string"
      );
    if (typeof parsed.id === "string") return [parsed.id];
    return [];
  } catch {
    return [];
  }
};
