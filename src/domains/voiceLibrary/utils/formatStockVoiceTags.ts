const capitalizeEveryWord = (text: string) =>
  text.replace(
    /(^|[\s-])(\p{L})/gu,
    (_match, separator: string, letter: string) =>
      `${separator}${letter.toUpperCase()}`
  );

export const formatStockVoiceTags = (tags: string[]): string =>
  tags.map((tag) => capitalizeEveryWord(tag.replaceAll("_", " "))).join(" · ");
