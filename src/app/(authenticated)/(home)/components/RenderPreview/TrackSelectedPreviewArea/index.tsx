/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { VideoAssetIngestionSuccess } from "@domains/asset/interface";
import { useImageAssetNames } from "@domains/asset/useImageAssetNames";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { parseSourcesForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { getTrackSources } from "@domains/track/utils/getTrackSources";
import { MultipleRenderPreview } from "@home/components/RenderPreview/MultipleRenderPreview";
import { SbsComparison } from "@home/components/RenderPreview/SbsComparison";
import { getSettingsToDisplay } from "@home/components/RenderPreview/SbsComparison/helpers/getSettingsToDisplay";
import { SettingsDisplay } from "@home/components/RenderPreview/SbsComparison/types";
import { SingleRenderPreview } from "@home/components/RenderPreview/SingleRenderPreview";
import { Layer } from "@schemas/layer";
import { PreviewMode, viewModeAtom, viewportPanZoomAtom } from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

import { useSelectedTracks } from "@/domains/track/useSelectedTracks";

const MAX_TRACKS_SBS = 2;
const MAX_TRACKS_TWO = 2;

const getTracksForViewMode = (
  viewMode: PreviewMode | string,
  selectedTracks: Layer[],
  controlNetVirtualLayers: Layer[]
): Layer[] => {
  const fillTracksWithControlNets = (maxTracks: number): Layer[] => {
    const slotsToFill = maxTracks - selectedTracks.length;
    const controlNetsToAdd = controlNetVirtualLayers.slice(
      0,
      Math.max(0, slotsToFill)
    );

    return [...selectedTracks, ...controlNetsToAdd].slice(0, maxTracks);
  };

  switch (viewMode) {
    case PreviewMode.SBS:
      return fillTracksWithControlNets(MAX_TRACKS_SBS);
    case PreviewMode.TWO:
      if (selectedTracks.length === 1 && controlNetVirtualLayers.length > 0) {
        return fillTracksWithControlNets(MAX_TRACKS_TWO);
      }
      return selectedTracks.slice(0, MAX_TRACKS_TWO);
    default:
      return selectedTracks;
  }
};

const createControlNetVirtualLayers = (
  baseTrack: Layer,
  controlNets: Array<{ name: string; video: string }>
): Layer[] => {
  return controlNets.map((controlNet, index) => ({
    ...baseTrack,
    id: `${baseTrack.id}-controlnet-${index}`,
    name: `${baseTrack.name} - ${controlNet.name}`,
    data: {
      ...baseTrack.data,
      controlNetOverride: {
        name: controlNet.name,
        video: controlNet.video
      }
    }
  }));
};

export const TrackSelectedPreviewArea: React.FC = () => {
  const { data: selectedLayers } = useSelectedTracks();
  const viewMode = useAtomValue(viewModeAtom);
  const setViewportPanZoom = useSetAtom(viewportPanZoomAtom);
  const prevSelectedIdsRef = useRef<string>("");

  const [firstTrack, secondTrack] = selectedLayers;

  const previewedIds = selectedLayers.map((l) => l.id).join("|");

  useEffect(() => {
    if (previewedIds === prevSelectedIdsRef.current) return;
    prevSelectedIdsRef.current = previewedIds;

    setViewportPanZoom((prev) => ({
      ...prev,
      zoom: 1,
      x: 0,
      y: 0
    }));
  }, [previewedIds, setViewportPanZoom]);

  useEffect(() => {
    setViewportPanZoom((prev) => ({
      ...prev,
      zoom: 1,
      x: 0,
      y: 0
    }));
  }, [viewMode, setViewportPanZoom]);

  const { data: videoAssetResponse } = useVideoAsset({
    assetId: getTrackAssetId(firstTrack),
    selectedLayerId: firstTrack?.id
  });

  const videoAsset = (
    videoAssetResponse as VideoAssetIngestionSuccess | undefined
  )?.asset;

  const availableControlNets = videoAsset?.manifest?.controlNets || [];

  const controlNetVirtualLayers =
    firstTrack && availableControlNets.length > 0
      ? createControlNetVirtualLayers(firstTrack, availableControlNets)
      : [];

  const selectedTracks = [firstTrack, secondTrack].filter(Boolean);

  const tracksForView = getTracksForViewMode(
    viewMode,
    selectedTracks,
    controlNetVirtualLayers
  );

  const { data: assetNamesMap } = useImageAssetNames({
    assetIds: Array.from(
      new Set(
        selectedLayers.flatMap((layer) => {
          const parsed = parseSourcesForFrontend({
            sources: getTrackSources(layer),
            render_settings: {
              magov2: getTrackRenderSettings(layer) as
                | Record<string, unknown>
                | undefined
            }
          });
          return parsed.map((entry) => entry.asset_id);
        })
      )
    )
  });

  const settingsToDisplay: SettingsDisplay[] = getSettingsToDisplay(
    tracksForView,
    assetNamesMap
  );

  switch (viewMode) {
    case PreviewMode.SINGLE:
      return <SingleRenderPreview track={firstTrack} />;

    case PreviewMode.SBS:
      return (
        <SbsComparison
          firstSelectedLayer={tracksForView[0]}
          secondSelectedLayer={tracksForView[1]}
          settingsToDisplay={settingsToDisplay}
        />
      );

    case PreviewMode.TWO:
      return (
        <MultipleRenderPreview
          firstSelectedLayer={tracksForView[0]}
          secondSelectedLayer={tracksForView[1]}
          settingsToDisplay={settingsToDisplay}
        />
      );

    default:
      return null;
  }
};
