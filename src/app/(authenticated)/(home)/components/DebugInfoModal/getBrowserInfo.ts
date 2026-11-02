export function getBrowserInfo(): string {
  if (typeof window === "undefined") return "—";
  return `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`;
}
