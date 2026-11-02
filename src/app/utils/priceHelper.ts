export function roundUp(value: number): number {
  return Math.ceil(value * 1000) / 1000;
}

export function roundUpFixed(value: number): number {
  return Math.ceil(value);
}

export function toFixed(value: number): string {
  return value.toFixed(0);
}
