export const truncateByCodePoint = (
  value: string,
  maxCodePoints: number
): string =>
  // oxlint-disable-next-line typescript/no-misused-spread -- deliberate: spreading a string yields Unicode code points, which is exactly what avoids severing a surrogate pair mid-character when truncating to the backend's column limit. Full grapheme-cluster safety (Intl.Segmenter) is unneeded scope for a run name.
  [...value].slice(0, maxCodePoints).join("");
