import { atomWithStorage } from "jotai/utils";

export type JotaiStorage<Value> = Parameters<typeof atomWithStorage<Value>>[2];

export const createInMemoryStorage = <Value>(): NonNullable<
  JotaiStorage<Value>
> => {
  const valuesByKey = new Map<string, Value>();

  return {
    getItem: (key: string, initialValue: Value): Value =>
      valuesByKey.has(key) ? valuesByKey.get(key)! : initialValue,
    setItem: (key: string, value: Value): void => {
      valuesByKey.set(key, value);
    },
    removeItem: (key: string): void => {
      valuesByKey.delete(key);
    }
  };
};
