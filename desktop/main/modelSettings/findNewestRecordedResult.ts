import type { ModelOperationResult } from "../../shared/modelSettings";

const recordedAtOf = (result: ModelOperationResult) =>
  Date.parse(String(result.details?.recordedAt)) || 0;

export const findNewestRecordedResult = (
  results: (ModelOperationResult | undefined)[]
): ModelOperationResult | undefined =>
  results
    .filter((result): result is ModelOperationResult => result !== undefined)
    .reduce<ModelOperationResult | undefined>(
      (newest, result) =>
        !newest || recordedAtOf(result) > recordedAtOf(newest)
          ? result
          : newest,
      undefined
    );
