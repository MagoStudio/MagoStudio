/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import {
  validateVideoFormat,
  getFps,
  estimateOutputSize,
  validateTrimOptions,
  trimAndEncodeVideo,
  padVideoToMinDuration,
  EncodingProgress
} from "@app/services/mediaBunny";
import { MainButton } from "@components/MainButton";
import { PlayButton } from "@components/PlayButton";
import { Text } from "@components/Text";
import { MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@constants";
import { UploadError } from "@home/components/fileUpload/UploadError";
import { UploadProgress } from "@home/components/fileUpload/UploadProgress";
import { useMountEffect } from "@hooks/useMountEffect";
import { TrimMetadata } from "@schemas/video";
import { checkWebCodecSupport } from "@utils/webCodecSupport";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProgressBar } from "react-aria-components/ProgressBar";
import { useTranslation } from "react-i18next";

import { TrimmerError } from "./TrimmerError";
import { TrimmingInputs } from "./TrimmingInputs";
import { TrimmingTimeline } from "./TrimmingTimeline";
import { useTrimValues } from "./useTrimValues";

const formatVideoTime = (seconds: number) => {
  const hours = Math.floor(seconds / SECONDS_IN_MINUTE / MINUTES_IN_HOUR);
  const mins = Math.floor(seconds / SECONDS_IN_MINUTE) % MINUTES_IN_HOUR;
  const secs = Math.floor(seconds % SECONDS_IN_MINUTE);
  const PAD_LENGTH = 2;

  return `${hours.toString().padStart(PAD_LENGTH, "0")}:${mins.toString().padStart(PAD_LENGTH, "0")}:${secs.toString().padStart(PAD_LENGTH, "0")}`;
};

const UPLOAD_PROGRESS_WARNING_THRESHOLD = 100;

interface VideoTrimmerProps {
  onConfirm?: ({
    trimMetadata,
    processedFile
  }: {
    trimMetadata?: TrimMetadata;
    processedFile?: File;
  }) => void;
  videoFile?: File | null;
  uploadProgress?: number;
  uploadError?: string;
  onClearFile?: () => void;
  minDurationSeconds?: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  onConfirm,
  videoFile,
  uploadProgress,
  uploadError,
  onClearFile,
  minDurationSeconds
}) => {
  const { t } = useTranslation();
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoObjectUrlRef = useRef<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [webCodecSupported, setWebCodecSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] =
    useState<EncodingProgress | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [sizeValidationError, setSizeValidationError] = useState<string | null>(
    null
  );
  const [videoValidation, setVideoValidation] = useState<
    { file: File; error: string | null } | undefined
  >(undefined);
  const [fps, setFps] = useState<number | undefined>(undefined);

  const videoValidationError =
    videoValidation && videoValidation.file === videoFile
      ? videoValidation.error
      : null;

  const attachVideoElement = (element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && videoObjectUrlRef.current) {
      element.src = videoObjectUrlRef.current;
    }
  };

  /* eslint-disable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-event-handler -- async format probe of the incoming file, not derivable in render */
  useEffect(() => {
    if (!videoFile) return;

    const validateVideo = async () => {
      try {
        const formatValidation = await validateVideoFormat(videoFile);

        if (formatValidation.error) {
          setVideoValidation({
            file: videoFile,
            error: formatValidation.error
          });
          return;
        }
        setVideoValidation({ file: videoFile, error: null });
        setVideoDuration(formatValidation.formatInfo.duration);

        const fpsValue = await getFps(videoFile);
        setFps(fpsValue);
      } catch (error) {
        console.error("Video format validation error:", error);
        setVideoValidation({ file: videoFile, error: null });
      }
    };

    void validateVideo();
  }, [videoFile]);
  /* eslint-enable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-event-handler */

  useEffect(() => {
    if (!videoFile) return;

    const objectUrl = URL.createObjectURL(videoFile);
    videoObjectUrlRef.current = objectUrl;
    if (videoRef.current) {
      videoRef.current.src = objectUrl;
    }

    return () => {
      videoObjectUrlRef.current = undefined;
      videoRef.current?.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]);

  // Check WebCodec support on mount
  useMountEffect(() => {
    const checkSupport = async () => {
      const supported = await checkWebCodecSupport();
      setWebCodecSupported(supported);
    };
    void checkSupport();
  });

  const updateVideoTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const {
    minTrimTime,
    maxTrimTime,
    handleMinTimeChange: rawHandleMinTimeChange,
    handleMaxTimeChange: rawHandleMaxTimeChange,
    handleBothTimesChange: rawHandleBothTimesChange,
    minInputMin,
    minInputMax,
    maxInputMin,
    maxInputMax
  } = useTrimValues(videoDuration, setCurrentTime, updateVideoTime);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handleMinTimeChange = useCallback(
    (newMin: number) => {
      pauseVideo();
      rawHandleMinTimeChange(newMin);
    },
    [pauseVideo, rawHandleMinTimeChange]
  );

  const handleMaxTimeChange = useCallback(
    (newMax: number) => {
      pauseVideo();
      rawHandleMaxTimeChange(newMax);
    },
    [pauseVideo, rawHandleMaxTimeChange]
  );

  const handleBothTimesChange = useCallback(
    (newMin: number, newMax: number) => {
      pauseVideo();
      rawHandleBothTimesChange(newMin, newMax);
    },
    [pauseVideo, rawHandleBothTimesChange]
  );

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-derived-state -- async size estimation into state, not derivable in render */
  useEffect(() => {
    const validateOutputSize = async () => {
      if (!videoFile || minTrimTime >= maxTrimTime) {
        setSizeValidationError(null);
        return;
      }

      try {
        const sizeEstimate = await estimateOutputSize(videoFile, {
          startTime: minTrimTime,
          endTime: maxTrimTime
        });

        if (sizeEstimate.exceedsLimit) {
          setSizeValidationError(
            `Estimated output size (${sizeEstimate.estimatedSizeMB}MB) exceeds 1GB limit. Please select a shorter range.`
          );
        } else {
          setSizeValidationError(null);
        }
      } catch (error) {
        console.error("Size validation error:", error);
        setSizeValidationError(null);
      }
    };

    void validateOutputSize();
  }, [minTrimTime, maxTrimTime, videoFile]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-derived-state */

  const handlePlayToggle = useCallback(() => {
    setIsPlaying(!isPlaying);
    if (!videoRef.current) {
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      return;
    }
    if (
      videoRef.current.currentTime < minTrimTime ||
      videoRef.current.currentTime >= maxTrimTime
    ) {
      videoRef.current.currentTime = minTrimTime;
    }
    videoRef.current.play().catch(() => {
      setIsPlaying(false);
    });
  }, [isPlaying, minTrimTime, maxTrimTime]);

  const handleConfirmWithWebCodec = useCallback(async () => {
    if (!onConfirm || !videoFile) {
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(null);
    setProcessingError(null);

    try {
      const validation = await validateTrimOptions(videoFile, {
        startTime: minTrimTime,
        endTime: maxTrimTime
      });

      if (!validation.valid) {
        setIsProcessing(false);
        setVideoValidation({
          file: videoFile,
          error: validation.error || "Invalid trim options"
        });
        return;
      }

      const result = await trimAndEncodeVideo(
        videoFile,
        { startTime: minTrimTime, endTime: maxTrimTime },
        (progress: EncodingProgress) => {
          setProcessingProgress(progress);
        }
      );

      if (!result.success || !result.file) {
        setIsProcessing(false);
        setProcessingError(result.error || "Failed to process video");
        return;
      }

      const processedFile = minDurationSeconds
        ? await padVideoToMinDuration(
            result.file,
            minDurationSeconds,
            (progress: EncodingProgress) => setProcessingProgress(progress)
          )
        : result.file;

      onConfirm({
        processedFile
      });
    } catch (error) {
      setIsProcessing(false);
      setProcessingProgress(null);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process video";
      setProcessingError(errorMessage);
    }
  }, [onConfirm, minTrimTime, maxTrimTime, videoFile, minDurationSeconds]);

  const handleConfirmWithoutWebCodec = useCallback(() => {
    if (!onConfirm) {
      return;
    }

    onConfirm({
      trimMetadata: {
        trimStart: minTrimTime,
        trimEnd: maxTrimTime
      }
    });
  }, [onConfirm, minTrimTime, maxTrimTime]);

  const handleConfirm = webCodecSupported
    ? handleConfirmWithWebCodec
    : handleConfirmWithoutWebCodec;

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);

      if (isPlaying && currentTime >= maxTrimTime) {
        videoRef.current.currentTime = minTrimTime;
      }
    }
  }, [isPlaying, minTrimTime, maxTrimTime]);

  const onPlay = useCallback(() => {
    if (!videoRef.current) {
      return;
    }
    const currentTime = videoRef.current.currentTime;
    if (currentTime < minTrimTime || currentTime >= maxTrimTime) {
      videoRef.current.currentTime = minTrimTime;
    }
    setIsPlaying(true);
  }, [minTrimTime, maxTrimTime]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const isUploading = uploadProgress !== undefined && uploadProgress > 0;
  const showUploadWarning =
    uploadProgress !== undefined &&
    uploadProgress < UPLOAD_PROGRESS_WARNING_THRESHOLD;
  const areTrimControlsDisabled = !!videoValidationError || isUploading;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="relative rounded-[20px] overflow-hidden bg-black flex-1 min-h-0 w-full">
        {uploadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <UploadError
              fileName={videoFile?.name ?? ""}
              uploadError={uploadError}
              onClearFileName={onClearFile ?? (() => {})}
            />
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <UploadProgress
              fileName={videoFile?.name ?? ""}
              progress={uploadProgress}
              showWarning={showUploadWarning}
            />
          </div>
        ) : videoValidationError ? (
          <TrimmerError
            error={videoValidationError}
            variant="validation"
            onClearFile={onClearFile}
          />
        ) : processingError ? (
          <TrimmerError
            error={processingError}
            variant="processing"
            onClearFile={onClearFile}
          />
        ) : isProcessing && processingProgress ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <Text variant="md" color="glyph-primary">
              {t("status.processing_video.label")}
            </Text>
            <ProgressBar
              value={processingProgress.percentage}
              maxValue={100}
              className="w-full max-w-md"
              aria-label={t("status.processing_video.label")}
            />
            <Text variant="sm" color="glyph-secondary">
              {t(`status.${processingProgress.stage}.label`)}
              {" - "}
              {Math.round(processingProgress.percentage)}%
            </Text>
          </div>
        ) : (
          <>
            <video
              ref={attachVideoElement}
              className="object-contain w-full h-full"
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
              <Text variant="lg" color="glyph-primary-on-pic">
                {`${formatVideoTime(currentTime)} / ${formatVideoTime(videoDuration)}`}
              </Text>
            </div>
          </>
        )}
      </div>

      {sizeValidationError && (
        <div className="p-3 bg-severity-error border border-severity-error rounded-s text-center">
          <Text variant="sm" color="glyph-error">
            {sizeValidationError}
          </Text>
        </div>
      )}
      <div className="flex gap-2 justify-between items-center">
        <PlayButton
          aria-label={isPlaying ? "Pause" : "Play"}
          isPlaying={isPlaying}
          onPress={handlePlayToggle}
          isDisabled={areTrimControlsDisabled}
        />
        <TrimmingTimeline
          fps={fps}
          videoDuration={videoDuration}
          currentTime={currentTime}
          onTimeChange={updateVideoTime}
          handleMinTimeChange={handleMinTimeChange}
          handleMaxTimeChange={handleMaxTimeChange}
          handleBothTimesChange={handleBothTimesChange}
          onConfirm={handleConfirm}
          minTrimTime={minTrimTime}
          maxTrimTime={maxTrimTime}
          disabled={areTrimControlsDisabled}
          videoFile={videoFile}
        />
        <TrimmingInputs
          minInputMin={minInputMin}
          minInputMax={minInputMax}
          maxInputMin={maxInputMin}
          maxInputMax={maxInputMax}
          minTrimTime={minTrimTime}
          maxTrimTime={maxTrimTime}
          handleMinTimeChange={handleMinTimeChange}
          handleMaxTimeChange={handleMaxTimeChange}
          disabled={areTrimControlsDisabled}
        />
        <MainButton
          onPress={handleConfirm}
          isDisabled={
            isProcessing ||
            isUploading ||
            !!processingError ||
            !!sizeValidationError ||
            !!videoValidationError ||
            !!uploadError
          }
        >
          {isProcessing
            ? t("status.processing.label")
            : isUploading
              ? t("status.uploading.label")
              : t("actions.video_preupload_modal_confirm.label")}
        </MainButton>
      </div>
    </div>
  );
};
