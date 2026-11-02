import { QueryKey, hashKey } from "@tanstack/react-query";

export const isSameQueryKey = (
  firstQueryKey: QueryKey,
  secondQueryKey: QueryKey
): boolean => hashKey(firstQueryKey) === hashKey(secondQueryKey);
