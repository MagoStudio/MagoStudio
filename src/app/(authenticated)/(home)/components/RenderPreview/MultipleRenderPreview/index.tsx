import { isLandscapeTrack } from "@domains/track/utils/isLandscapeTrack";
import { RenderPreviewRow } from "@home/components/RenderPreview/MultipleRenderPreviewRow";
import { SettingsDisplay } from "@home/components/RenderPreview/SbsComparison/types";
import { Layer } from "@schemas/layer";
import { viewModeAtom, PreviewMode } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useState } from "react";

interface Props {
  firstSelectedLayer?: Layer;
  secondSelectedLayer?: Layer;
  settingsToDisplay?: SettingsDisplay[];
}

export const MultipleRenderPreview: React.FC<Props> = ({
  firstSelectedLayer,
  secondSelectedLayer,
  settingsToDisplay = []
}) => {
  const viewMode = useAtomValue(viewModeAtom);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(true);

  const reducedPadding = viewMode === PreviewMode.TWO;
  const stackTwoLandscapeVertically =
    viewMode === PreviewMode.TWO &&
    isLandscapeTrack(firstSelectedLayer) &&
    (secondSelectedLayer ? isLandscapeTrack(secondSelectedLayer) : true);

  return (
    <div className="flex flex-col w-full h-full justify-between">
      <RenderPreviewRow
        leftTrack={firstSelectedLayer}
        rightTrack={secondSelectedLayer}
        settingsToDisplay={[settingsToDisplay[0], settingsToDisplay[1]]}
        isDisclosureOpen={isDisclosureOpen}
        onDisclosureChange={setIsDisclosureOpen}
        reducedPadding={reducedPadding}
        stackVertically={stackTwoLandscapeVertically}
      />
    </div>
  );
};
