const CUE_EXTENSION_PATTERN =
  /\((?:v\.?\s*o\.?|o\.?\s*s\.?|o\.?\s*c\.?|cont'?d)\)/gi;

export const listCharacterNameAliases = (name: string): string[][] =>
  name
    .replace(CUE_EXTENSION_PATTERN, " ")
    .split("/")
    .map((namePart) =>
      namePart
        .replace(/\([^)]*\)/g, " ")
        .trim()
        .toUpperCase()
        .split(/\s+/)
        .filter(Boolean)
    )
    .filter((words) => words.length > 0);
