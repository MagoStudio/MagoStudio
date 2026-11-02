import { SheetGroup } from "@schemas/scriptProject";

export type SheetGroupDesignFamily = {
  key: string;
  label: string;
  groups: SheetGroup[];
  hasVersions: boolean;
};

const baseToken = (token: string): string => token.split("--", 1)[0];

export const sheetGroupDesignLabel = (group: SheetGroup): string | null => {
  if (group.alt && group.alt.toLowerCase() !== "default") return group.alt;
  const separator = group.token.indexOf("--");
  if (separator < 0) return null;
  return group.token
    .slice(separator + 2)
    .split(/[-_]+/)
    .filter(Boolean)
    .join(" ");
};

/** Groups the base slot and its `--variant` slots. A one-off manually named slot remains flat. */
export const groupSheetGroupsByDesignFamily = (
  groups: SheetGroup[]
): SheetGroupDesignFamily[] => {
  const families = new Map<string, SheetGroup[]>();
  for (const group of groups) {
    const key = group.master_token || baseToken(group.token);
    families.set(key, [...(families.get(key) ?? []), group]);
  }

  return [...families.entries()].map(([key, members]) => {
    const sorted = [...members].sort((left, right) => {
      const leftIsBase = left.token === key || left.is_design_master === true;
      const rightIsBase =
        right.token === key || right.is_design_master === true;
      if (leftIsBase !== rightIsBase) return leftIsBase ? -1 : 1;
      return left.token.localeCompare(right.token);
    });
    const base = sorted.find((group) => group.token === key) ?? sorted[0];
    return {
      key,
      label: base.name,
      groups: sorted,
      hasVersions:
        sorted.length > 1 || sorted.some((group) => group.token.includes("--"))
    };
  });
};
