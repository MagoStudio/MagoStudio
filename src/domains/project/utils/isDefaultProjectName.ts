export const isDefaultProjectName = (
  name: string,
  defaultName: string
): boolean => {
  const escaped = defaultName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(_\\d+)?$`).test(name);
};
