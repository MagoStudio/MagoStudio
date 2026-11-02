export const parseShotHeadingNumber = (
  heading: string | null | undefined
): string | undefined =>
  heading?.trim().match(/^(\d+(?:\.\d+)*)(?=$|[\s.:)\-])/u)?.[1];
