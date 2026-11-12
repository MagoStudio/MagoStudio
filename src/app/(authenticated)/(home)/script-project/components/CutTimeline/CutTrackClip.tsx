import { AnimatedGradient } from "@components/AnimatedGradient";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
import { bucketFilmstripWidth } from "@domains/scriptProject/utils/bucketFilmstripWidth";
import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import { useMediaBunnyFilmstrip } from "@hooks/preview/useMediaBunnyFilmstrip";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

const FILMSTRIP_WIDTH_MULTIPLIER = 10;

export const CUT_TRACK_CLIP_HEIGHT_PX = 76;

type Props = {
  clip: CutTimelineClip;
  widthPercent: number;
  isActive: boolean;
  onDownload: () => void;
};

export const CutTrackClip: React.FC<Props> = ({
  clip,
  widthPercent,
  isActive,
  onDownload
}) => {
  const { t } = useTranslation();

  const shotLabel = formatShotTitle({
    heading: clip.heading,
    shotIndex: clip.shotIndex
  });

  const { data: filmstripUrl } = useMediaBunnyFilmstrip({
    trackId: "",
    assetId: clip.assetId ?? "",
    fps: SHOT_FPS,
    width: bucketFilmstripWidth(widthPercent * FILMSTRIP_WIDTH_MULTIPLIER),
    videoUrl: clip.videoUrl,
    enabled: !!clip.assetId && !!clip.videoUrl
  });

  const showsPoster = !filmstripUrl && !!clip.posterUrl;

  return (
    <div
      className={cn(
        "group relative shrink-0 overflow-hidden rounded",
        clip.doesClipHaveRender
          ? "bg-element-primary"
          : "bg-surface-primary opacity-60",
        clip.hasClipRenderFailed && "ring-1 ring-inset ring-glyph-error",
        isActive && "ring-2 ring-inset ring-glyph-action-main"
      )}
      style={{
        width: `${widthPercent}%`,
        height: CUT_TRACK_CLIP_HEIGHT_PX
      }}
      title={clip.heading ?? undefined}
      data-testid={`cut-timeline-clip-${clip.sequenceId}`}
    >
      {clip.isClipRendering && <AnimatedGradient />}
      {filmstripUrl && (
        <img
          alt={clip.heading ?? t("script_project.shot_filmstrip.alt")}
          className="absolute inset-0 h-full w-full object-cover object-left"
          src={filmstripUrl}
        />
      )}
      {showsPoster && (
        <div
          role="img"
          aria-label={clip.heading ?? t("script_project.shot_filmstrip.alt")}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${clip.posterUrl ? toDesktopCloudStorageUrl(clip.posterUrl) : ""})`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            backgroundPosition: "left center"
          }}
        />
      )}

      <div className="absolute bottom-1 left-1 max-w-[calc(100%-0.5rem)] rounded bg-element-on-image px-1.5 py-0.5 backdrop-blur-[10px]">
        <Text
          component="span"
          variant="2xs"
          color="glyph-primary-on-pic"
          className="block truncate"
        >
          {shotLabel}
        </Text>
      </div>

      {clip.isClipPlayable && (
        <IconActionButton
          aria-label={t("script_project.download_shot_button.label")}
          icon={<Icon iconSet="16" iconName="download" />}
          variant="onImage"
          size="xs"
          onPress={onDownload}
          className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100 data-[focus-visible]:opacity-100"
          data-testid={`timeline-download-${clip.sequenceId}`}
        />
      )}
    </div>
  );
};
