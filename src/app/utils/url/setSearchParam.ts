export const setSearchParam = (
  search: string,
  key: string,
  value: string | undefined
): string => {
  const params = new URLSearchParams(search);

  if (value === undefined) {
    params.delete(key);
  } else {
    params.set(key, value);
  }

  return params.toString();
};
