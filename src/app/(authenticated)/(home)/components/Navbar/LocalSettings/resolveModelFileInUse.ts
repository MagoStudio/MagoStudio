import { findFilenameIgnoringCase } from "../../../../../../../desktop/shared/findFilenameIgnoringCase";
import type { ModelSettingsSnapshot } from "../../../../../../../desktop/shared/modelSettings";

export const resolveModelFileInUse = (
  component: ModelSettingsSnapshot["components"][number]
) =>
  findFilenameIgnoringCase(
    [
      component.recommendedFile.filename,
      ...component.choices.map((choice) => choice.filename)
    ],
    component.selectedFile
  ) ?? component.selectedFile;
