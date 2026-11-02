import { createHash } from "node:crypto";

import { textOf } from "../../vlm/dialogue";

const HASH_PREFIX_LENGTH = 8;

/**
 * An entity name as a
 * stable identifier ("D'Artagnan" -> "d_artagnan"). A name with nothing left
 * after ASCII transliteration (CJK, Arabic, Cyrillic, ...) falls back to a
 * short stable hash, so distinct entities stay distinct.
 */
export const slugifyName = (name: string): string => {
  const asciiOnly = name.normalize("NFKD").replace(/[\u0080-\uffff]/g, "");
  const slug = asciiOnly
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (slug) return slug;
  return `entity_${createHash("sha1").update(name, "utf8").digest("hex").slice(0, HASH_PREFIX_LENGTH)}`;
};

/**
 * The case-, punctuation- and accent-insensitive form a script
 * cue ("MRS. HUDSON") and a casting name ("Mrs. Hudson") are compared in.
 * Blank folds to "" so a speakerless cue never matches.
 */
export const speakerKey = (value: unknown): string => {
  const text = textOf(value).trim();
  return text ? slugifyName(text) : "";
};
