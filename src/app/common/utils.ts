import { TRACK_WIDTH_WITHOUT_BORDER } from "@config/constants";
import { DECIMAL_PRECISION } from "@constants";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { Layer, LayerType } from "@schemas/layer";
import { getImageDimensions as getImageDimensionsUtil } from "@utils/image/resizeImage";
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const HTTP_STATUS_PRECONDITION_FAILED = 412;
const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
const MOBILE_ASPECT_RATIO_MIN = 1.3;
const MOBILE_ASPECT_RATIO_MAX = 2.5;
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

const namedZIndexTokens = [
  "tooltip",
  "popover",
  "toast",
  "nested-modal",
  "modal",
  "page-popover",
  "help-button",
  "menu"
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      z: [{ z: namedZIndexTokens }]
    }
  }
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getImageDimensions = getImageDimensionsUtil;

export const getImageExtension = (file: File): string => {
  return file.name.split(".").pop()?.toLowerCase() || "";
};

const getLayersWithoutErrorOnes = (layers: Layer[] | undefined) => {
  if (!layers) return [];
  return layers.filter((layer) => {
    if (layer.type.toLowerCase() !== LayerType.IMAGE) return true;
    return !getTrackAssetData(layer)?.error;
  });
};

export const getLatestVideoLayer = (layers: Layer[] | undefined) => {
  if (!layers) return undefined;
  return layers.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
};

export const getFilteredAndSortedLayers = (layers?: Layer[]) => {
  const filteredLayers = getLayersWithoutErrorOnes(layers);
  const videoLayers = filteredLayers.filter(
    (layer) => layer.type.toLowerCase() === LayerType.IMAGE.toLowerCase()
  );

  if (videoLayers.length === 0) {
    return [];
  }

  const latestVideoLayer = getLatestVideoLayer(videoLayers);
  if (!latestVideoLayer) {
    return [];
  }

  const renderLayers = filteredLayers
    .filter(
      (layer) =>
        layer.type.toLowerCase() === LayerType.RENDER.toLowerCase() &&
        layer.active
    )
    .sort((a, b) => a.layer_order - b.layer_order);
  return [latestVideoLayer, ...renderLayers];
};

async function saveVideoToFileSystem(
  videoBlob: Blob,
  defaultFileName = "video.mp4"
) {
  // @ts-ignore: File System Access API is not yet in TypeScript lib
  if (!window.showSaveFilePicker) {
    throw new Error("File System Access API is not supported in this browser.");
  }

  const options = {
    suggestedName: defaultFileName,
    types: [
      {
        description: "MP4 Video",
        accept: { "video/mp4": [".mp4"] }
      }
    ]
  };

  // @ts-ignore
  const handle = await window.showSaveFilePicker(options);
  const writable = await handle.createWritable();
  await writable.write(videoBlob);
  await writable.close();
}

export const getUploadErrorMessage = (error: any): string => {
  if (!error) {
    return "Upload failed";
  }

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Processing error:", error, "Type:", typeof error);
  }

  if (typeof error === "object" && "response" in error) {
    const status = error.response?.status;

    switch (status) {
      case HTTP_STATUS_PRECONDITION_FAILED:
        return "upload_button_network_error_412";
      case HTTP_STATUS_UNPROCESSABLE_ENTITY:
        return "upload_button_processing_error_422";
      default:
        return "upload_button_file_processing_error";
    }
  }

  if (typeof error === "object" && error.message) {
    const message = error.message;
    if (message.startsWith("upload_button_")) {
      return message;
    }
    if (
      message.includes(HTTP_STATUS_PRECONDITION_FAILED.toString()) ||
      message.includes("network")
    ) {
      return "upload_button_network_error_412";
    }
    if (
      message.includes(HTTP_STATUS_UNPROCESSABLE_ENTITY.toString()) ||
      message.includes("processing")
    ) {
      return "upload_button_processing_error_422";
    }
  }

  if (typeof error === "string") {
    if (
      error.includes(HTTP_STATUS_PRECONDITION_FAILED.toString()) ||
      error.includes("network")
    ) {
      return "upload_button_network_error_412";
    }
    if (
      error.includes(HTTP_STATUS_UNPROCESSABLE_ENTITY.toString()) ||
      error.includes("processing")
    ) {
      return "upload_button_processing_error_422";
    }
    return error;
  }

  if (typeof error === "object") {
    return "upload_button_file_processing_error";
  }

  return "upload_button_file_processing_error";
};

export const translateErrorMessage = (
  error: string | undefined,
  t: (key: string) => string
): string => {
  if (!error) return "";

  if (error.startsWith("upload_button_")) {
    return t(`notifications.${error}.description`);
  }

  return error;
};

export function isMacOS(): boolean {
  if (typeof window === "undefined") return false;
  return /Mac/i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;

  const mobileRegex =
    /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  const isMobileUA = mobileRegex.test(ua);
  const isTabletUA = tabletRegex.test(ua);

  const isWindows = /Windows/i.test(ua);
  const isMac = /Mac/i.test(ua);
  const isLinux = /Linux/i.test(ua);
  const isDesktopOS = isWindows || isMac || isLinux;

  const hasTouch =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    // @ts-ignore: msMaxTouchPoints is not in the type
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const windowWidth = window.innerWidth;

  const aspectRatio =
    Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
  const isMobileAspectRatio =
    aspectRatio > MOBILE_ASPECT_RATIO_MIN &&
    aspectRatio < MOBILE_ASPECT_RATIO_MAX;

  const isSmallScreen = windowWidth < TABLET_BREAKPOINT;
  const isMediumScreen =
    windowWidth >= TABLET_BREAKPOINT && windowWidth < DESKTOP_BREAKPOINT;

  if (isMobileUA || isTabletUA) {
    return true;
  }

  if (isDesktopOS && hasTouch) {
    return isSmallScreen && isMobileAspectRatio;
  }

  if (!isDesktopOS && (isSmallScreen || isMediumScreen)) {
    return true;
  }

  return isSmallScreen;
}

const getTrackRange = (track: Layer): [number, number] | null => {
  if (!getTrackClip(track)) return null;

  return frameRangeOf(track);
};

export const getSelectedTracksIntersection = (
  selectedTracks: Layer[]
): [number, number] | null => {
  const validRanges = selectedTracks
    .map(getTrackRange)
    .filter((range): range is [number, number] => range !== null);

  if (validRanges.length === 0) return null;

  const [start, end] = validRanges.reduce(
    ([accStart, accEnd], [rangeStart, rangeEnd]) => [
      Math.max(accStart, rangeStart),
      Math.min(accEnd, rangeEnd)
    ]
  );

  return start <= end ? [start, end] : null;
};

export const isFrameWithinPlayableRange = (
  currentFrame: number,
  clipOffset: number,
  clipDuration: number,
  globalStart: number,
  globalEnd: number
): boolean => {
  const clipStart = clipOffset;
  const clipEnd = clipOffset + clipDuration;

  const effectiveStart = Math.max(clipStart, globalStart);
  const effectiveEnd = Math.min(clipEnd, globalEnd);

  return currentFrame >= effectiveStart && currentFrame <= effectiveEnd;
};

const getPixelOffsetFromFrames = (
  frames: number,
  timelineMaxFrames: number
): number => {
  if (timelineMaxFrames === 0) return 0;
  return (frames / timelineMaxFrames) * TRACK_WIDTH_WITHOUT_BORDER;
};

export const getClipPositionAndSize = (
  offset: number,
  duration: number,
  timelineMaxFrames: number
): { clipWidth: number; clipOffset: number } => {
  const clipWidth = Math.ceil(
    getPixelOffsetFromFrames(duration, timelineMaxFrames)
  );
  const clipOffset = getPixelOffsetFromFrames(offset, timelineMaxFrames);
  return { clipWidth, clipOffset };
};

export const shouldShowDismissedAlert = (
  dismissedTimestamp: number | null,
  timeoutMs: number
): boolean => {
  if (!dismissedTimestamp) {
    return true;
  }

  return Date.now() - dismissedTimestamp > timeoutMs;
};

export function floorToPrecision(value: number, precision = DECIMAL_PRECISION) {
  return Math.floor(value * precision) / precision;
}

export function ceilToPrecision(value: number, precision = DECIMAL_PRECISION) {
  return Math.ceil(value * precision) / precision;
}
