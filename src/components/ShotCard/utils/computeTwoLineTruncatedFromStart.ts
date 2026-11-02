const ELLIPSIS = "…";

export function computeTwoLineTruncatedFromStart(
  fullName: string,
  fitsWithinTwoLines: (candidate: string) => boolean
): string {
  if (fitsWithinTwoLines(fullName)) return fullName;

  let visibleSuffixLengthThatFits = 0;
  let low = 0;
  let high = fullName.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = ELLIPSIS + fullName.slice(fullName.length - mid);
    if (fitsWithinTwoLines(candidate)) {
      visibleSuffixLengthThatFits = mid;
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return (
    ELLIPSIS + fullName.slice(fullName.length - visibleSuffixLengthThatFits)
  );
}
