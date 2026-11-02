import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

import * as schema from "./schema";

type QueryMethod = "run" | "all" | "values" | "get";

const execute = (
  sqlite: DatabaseSync,
  query: string,
  params: unknown[],
  method: QueryMethod
): { rows: unknown[] } => {
  const statement = sqlite.prepare(query);
  const inputValues = params as SQLInputValue[];

  if (method === "run") {
    statement.run(...inputValues);
    return { rows: [] };
  }

  // sqlite-proxy expects positional rows and performs the selected-field
  // mapping itself. Returning node:sqlite objects silently loses column data.
  statement.setReturnArrays(true);
  if (method === "get") {
    const row = statement.get(...inputValues);
    return { rows: row === undefined ? [] : [row] };
  }

  return { rows: statement.all(...inputValues) };
};

export const createDrizzleDatabase = (
  sqlite: DatabaseSync,
  onError?: (error: unknown) => void,
  assertUsable?: () => void
): SqliteRemoteDatabase<typeof schema> =>
  drizzle(
    async (query, params, method) => {
      assertUsable?.();
      try {
        return execute(sqlite, query, params, method);
      } catch (error) {
        onError?.(error);
        throw error;
      }
    },
    async (batch) =>
      batch.map(({ sql, params, method }) => {
        assertUsable?.();
        try {
          return execute(sqlite, sql, params, method);
        } catch (error) {
          onError?.(error);
          throw error;
        }
      }),
    { schema }
  );
