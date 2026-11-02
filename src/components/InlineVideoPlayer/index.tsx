import { PlayButton } from "@components/PlayButton";
import { cn } from "@utils";
import { useRef, useState } from "react";

const objectFitClasses = {
  contain: "object-contain",
  cover: "object-cover"
} as const;

export interface InlineVideoPlayerProps {
  videoUrl: string;
  posterUrl: string | undefined;
  posterAlt?: string;
  playAriaLabel: string;
  pauseAriaLabel: string;
  objectFit?: keyof typeof objectFitClasses;
  testId?: string;
}

export const InlineVideoPlayer: React.FC<InlineVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  posterAlt = "",
  playAriaLabel,
  pauseAriaLabel,
  objectFit = "contain",
  testId
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (failedUrl === videoUrl)
    return (
      <div
        role="status"
        className="absolute inset-0 flex flex-col items-center justify-center text-sm"
      >
        <span>Video unavailable</span>
        <button
          type="button"
          className="underline"
          onClick={() => {
            setFailedUrl(undefined);
            setHasPlaybackStarted(false);
          }}
        >
          Retry
        </button>
      </div>
    );

  const mediaClassName = cn(
    "absolute inset-0 h-full w-full",
    objectFitClasses[objectFit]
  );

  const togglePlayback = () => {
    const video = videoRef.current;

    if (!video) {
      setHasPlaybackStarted(true);
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
  };

  return (
    <>
      {hasPlaybackStarted ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onEnded={() => setIsVideoPlaying(false)}
          onError={() => {
            setFailedUrl(videoUrl);
            setIsVideoPlaying(false);
          }}
          className={mediaClassName}
          data-testid={testId}
        />
      ) : (
        posterUrl && (
          <img src={posterUrl} alt={posterAlt} className={mediaClassName} />
        )
      )}
      <PlayButton
        isPlaying={isVideoPlaying}
        onPress={togglePlayback}
        aria-label={isVideoPlaying ? pauseAriaLabel : playAriaLabel}
        className={cn(
          "absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent text-glyph-primary-on-pic",
          "transition-opacity data-[hovered]:bg-transparent [&_svg]:size-6",
          isVideoPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      />
    </>
  );
};
