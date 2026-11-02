import { Text } from "@components/Text";

import type { StarterInstallFile } from "../../../../desktop/shared/contracts";

import { LocalSetupDownloadFileStateIndicator } from "./LocalSetupDownloadFileStateIndicator";
import { describeDownloadFileProgress } from "./utils/describeDownloadFileProgress";

export const LocalSetupDownloadFileRow = ({
  file,
  isDownloadPaused
}: {
  file: StarterInstallFile;
  isDownloadPaused: boolean;
}) => (
  <div
    title={file.destination}
    className="flex items-center gap-2 border-b border-element-primary py-1.5"
  >
    <span className="flex size-4 shrink-0 items-center justify-center">
      <LocalSetupDownloadFileStateIndicator
        file={file}
        isDownloadPaused={isDownloadPaused}
      />
    </span>
    <Text
      component="span"
      variant="sm"
      color={file.state === "done" ? "glyph-tertiary" : "glyph-secondary"}
      className="min-w-0 flex-1 truncate"
    >
      {file.name}
    </Text>
    <Text
      component="span"
      variant="sm"
      color={file.state === "error" ? "glyph-error" : "glyph-tertiary"}
      className="shrink-0"
    >
      {describeDownloadFileProgress(file, isDownloadPaused)}
    </Text>
  </div>
);
