import { Text } from "@components/Text";
import { isKlingModel } from "@domains/renders/utils/isKlingModel";
import { isUpscaleModel } from "@domains/renders/utils/isUpscaleModel";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getOutputBiggestSide } from "@domains/track/utils/getOutputBiggestSide";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { Layer } from "@schemas/layer";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { StarsRating } from "./Rating/StarsRating";

dayjs.extend(timezone);

const TrackSettingsSummary: React.FC<{ title: string; className?: string }> = ({
  title,
  className
}) => (
  <Text
    color="glyph-tertiary"
    component="span"
    variant="sm"
    whiteSpace="nowrap"
    className={className}
  >
    {title}
  </Text>
);

interface Props {
  track: Layer;
}

export const TimelineTrackSettings: React.FC<Props> = ({ track }) => {
  const { t } = useTranslation();
  const timezone = dayjs.tz.guess();
  const clip = getTrackClip(track);
  const renderSettings = getTrackRenderSettings(track);
  const createdAt = clip?.asset?.created_at;
  const controlType = renderSettings?.control_type;
  const hasControlTypeLabel =
    typeof controlType === "string" && controlType.length > 0;

  const dateInLocalTimezone = createdAt
    ? dayjs(createdAt).tz(timezone)
    : undefined;

  const formattedCreatedAt = dateInLocalTimezone
    ? `${dateInLocalTimezone.format("YYYY-MM-DD")}\u00A0\u00A0${dateInLocalTimezone.format("HH:mm:ss")}`
    : "";

  const magoEngine = renderSettings?.mago_engine as VideoEngine | undefined;

  const magoModel = RENDER_MODELS.find((model) => model.name === magoEngine);

  const outputSize = getTrackAssetData(track)?.output_size;
  const resolutionDisplay = useMemo(
    () => getOutputBiggestSide(renderSettings, outputSize),
    [renderSettings, outputSize]
  );

  const backgroundTag = useMemo(() => {
    if (magoEngine === VideoEngine.V4_0_0) {
      return t("trackSettings.chara_only.label");
    }

    if (magoEngine === VideoEngine.V4_1_0) {
      return t("trackSettings.with_background.label");
    }

    return null;
  }, [magoEngine, t]);

  const [frameRangeStart, frameRangeEnd] = frameRangeOf(track);
  const frameRange =
    frameRangeEnd > frameRangeStart
      ? ([frameRangeStart, frameRangeEnd] as [number, number])
      : undefined;

  const shouldShowResolution = !isKlingModel(magoEngine);

  return (
    <div
      className="flex items-center gap-3 select-none w-timeline-container pl-4 h-track-settings"
      data-testid="timeline-track-settings"
    >
      <StarsRating track={track} />
      <div className="flex items-start gap-3 min-w-0">
        {magoModel && <TrackSettingsSummary title={magoModel.displayName} />}
        {backgroundTag && <TrackSettingsSummary title={backgroundTag} />}
        {frameRange && (
          <TrackSettingsSummary
            title={`${frameRange[0]}—${frameRange[1]}fr.`}
          />
        )}
        {shouldShowResolution && resolutionDisplay && (
          <TrackSettingsSummary title={`${resolutionDisplay}px.`} />
        )}
        {formattedCreatedAt && (
          <TrackSettingsSummary title={formattedCreatedAt} />
        )}
        {hasControlTypeLabel && !isUpscaleModel(magoEngine) && (
          <TrackSettingsSummary
            title={t(`renderSettings.control_type.${controlType}`)}
            className="truncate min-w-0"
          />
        )}
      </div>
    </div>
  );
};
