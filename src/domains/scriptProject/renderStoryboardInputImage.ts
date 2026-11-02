import { loadImageElement } from "@app/services/canvas/loadImageElement";

import { createStoryboardSheetCanvas } from "./createStoryboardSheetCanvas";
import { buildStoryboardGridImageSource } from "./utils/buildStoryboardGridImageSource";
import { StoryboardPanelBox } from "./utils/layoutStoryboardGrid";

export const renderStoryboardInputImage = async ({
  panelBoxes,
  fileName
}: {
  panelBoxes: StoryboardPanelBox[];
  fileName: string;
}): Promise<File> => {
  const sheet = createStoryboardSheetCanvas();
  sheet.ctx.drawImage(
    await loadImageElement(
      buildStoryboardGridImageSource({ panelBoxes, hasWhitePaper: true })
    ),
    0,
    0
  );
  const sheetBlob = await new Promise<Blob | null>((resolve) =>
    sheet.canvas.toBlob(resolve, "image/png")
  );
  if (!sheetBlob) throw new Error("Could not encode the storyboard grid");
  return new File([sheetBlob], fileName, { type: "image/png" });
};
