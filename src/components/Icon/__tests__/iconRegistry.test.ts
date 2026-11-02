import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { type IconSet, iconRegistry } from "../iconRegistry";

const ASSETS_DIR = path.resolve(__dirname, "../../../app/assets");

const ICON_SET_DIR_MAP: Record<IconSet, string> = {
  "16": "icons/16",
  "16-filled": "icons/16-filled",
  "16-technical": "icons/16-technical",
  "24": "icons/24",
  "24-filled": "icons/24-filled",
  bold: "icons/bold",
  decorators: "icons/decorators",
  loading: "icons/loading",
  pixels: "icons/pixels"
};

const ICON_FILE_NAME_MAP: Partial<Record<IconSet, Record<string, string>>> = {
  loading: { "16": "loading-16", "24": "loading-24" }
};

describe("iconRegistry", () => {
  const iconSets = Object.keys(iconRegistry) as IconSet[];

  for (const iconSet of iconSets) {
    const icons = Object.keys(iconRegistry[iconSet]);
    if (icons.length === 0) continue;

    describe(`"${iconSet}" icon set`, () => {
      const dir = ICON_SET_DIR_MAP[iconSet];

      it.each(icons)("should have SVG file for '%s'", (iconName) => {
        const fileName = ICON_FILE_NAME_MAP[iconSet]?.[iconName] ?? iconName;
        const svgPath = path.join(ASSETS_DIR, dir, `${fileName}.svg`);
        expect(fs.existsSync(svgPath), `Missing SVG: ${svgPath}`).toBe(true);
      });
    });
  }
});
