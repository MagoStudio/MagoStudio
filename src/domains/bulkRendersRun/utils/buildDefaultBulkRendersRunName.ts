import { BULK_RENDERS_RUN_NAME_MAX_LENGTH } from "@schemas/bulkRendersRun";

import { truncateByCodePoint } from "./truncateByCodePoint";

export const buildDefaultBulkRendersRunName = ({
  existingRunCount,
  projectName
}: {
  existingRunCount: number;
  projectName: string;
}): string =>
  truncateByCodePoint(
    `Bulk ${existingRunCount + 1}_${projectName}`,
    BULK_RENDERS_RUN_NAME_MAX_LENGTH
  );
