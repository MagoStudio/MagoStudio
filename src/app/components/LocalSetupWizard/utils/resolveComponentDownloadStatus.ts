import { LocalSetupComponent } from "../localSetupWizardStubs";

const PERCENTAGE_SCALE = 100;

export type ComponentDownloadStatus =
  | { kind: "done" }
  | { kind: "inProgress"; percentage: number }
  | { kind: "waiting" };

export const resolveComponentDownloadStatus = ({
  components,
  componentId,
  downloadedGigabytes
}: {
  components: LocalSetupComponent[];
  componentId: string;
  downloadedGigabytes: number;
}): ComponentDownloadStatus => {
  let gigabytesBeforeComponent = 0;

  for (const component of components) {
    if (component.id !== componentId) {
      gigabytesBeforeComponent += component.gigabytes;
      continue;
    }

    const downloadedForComponent =
      downloadedGigabytes - gigabytesBeforeComponent;

    if (downloadedForComponent >= component.gigabytes) return { kind: "done" };
    if (downloadedForComponent <= 0) return { kind: "waiting" };

    return {
      kind: "inProgress",
      percentage: Math.round(
        (downloadedForComponent / component.gigabytes) * PERCENTAGE_SCALE
      )
    };
  }

  return { kind: "waiting" };
};
