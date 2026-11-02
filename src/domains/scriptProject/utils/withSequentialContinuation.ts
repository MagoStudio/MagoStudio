import { SequentialShotMode } from "@schemas/scriptProject";

import { SEQUENTIAL_CONTINUATION_OFF } from "../constants";

import { ResolvedSequentialShotConfig } from "./resolveSequentialShotConfig";

export type SequentialContinuation =
  | SequentialShotMode
  | typeof SEQUENTIAL_CONTINUATION_OFF;

export const withSequentialContinuation = (
  config: ResolvedSequentialShotConfig,
  continuation: SequentialContinuation
): ResolvedSequentialShotConfig =>
  continuation === SEQUENTIAL_CONTINUATION_OFF
    ? { ...config, enabled: false }
    : { ...config, enabled: true, mode: continuation };
