import type { ScriptSetupRequirement } from "../../../../../desktop/shared/contracts";

export const groupSetupRequirements = (
  items: ScriptSetupRequirement[],
  debugMissing: boolean
) => {
  const groups = new Map<
    string,
    { item: ScriptSetupRequirement; names: string[] }
  >();
  for (const item of items) {
    if (!debugMissing && item.status === "installed") continue;
    const key =
      item.installKind === "node" || item.installKind === "core"
        ? item.url
        : item.name;
    const group = groups.get(key);
    if (group) {
      if (!group.names.includes(item.name)) group.names.push(item.name);
    } else groups.set(key, { item, names: [item.name] });
  }
  return [...groups.values()];
};
