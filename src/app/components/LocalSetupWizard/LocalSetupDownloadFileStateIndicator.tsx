import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";

import type { StarterInstallFile } from "../../../../desktop/shared/contracts";

export const LocalSetupDownloadFileStateIndicator = ({
  file,
  isDownloadPaused
}: {
  file: StarterInstallFile;
  isDownloadPaused: boolean;
}) => {
  if (file.state === "done")
    return (
      <Icon
        iconSet="16"
        iconName="checkmark"
        className="text-severity-success"
      />
    );
  if (file.state === "error")
    return (
      <Icon iconSet="16-filled" iconName="error" className="text-glyph-error" />
    );
  const isFileInProgress =
    (file.state === "downloading" || file.state === "verifying") &&
    !isDownloadPaused;
  if (isFileInProgress)
    return (
      <CircularProgress
        size="sm"
        color="glyph-primary"
        aria-label={`${file.state === "verifying" ? "Verifying" : "Downloading"} ${file.name}`}
      />
    );
  return (
    <span
      aria-label={file.state}
      className="size-3 rounded-full border border-glyph-tertiary"
    />
  );
};
