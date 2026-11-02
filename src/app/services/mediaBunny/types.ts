export interface TrimOptions {
  startTime: number;
  endTime: number;
}

export interface EncodingProgress {
  percentage: number;
  stage: "loading" | "processing" | "encoding" | "finalizing";
}

export interface EncodingResult {
  success: boolean;
  file?: File;
  error?: string;
}

export interface VideoFormatInfo {
  hasValidDuration: boolean;
  duration: number;
  detectedFormat: string;
  expectedFormat?: string;
  hasContainerMismatch: boolean;
}

export interface VideoValidationInfo {
  formatInfo: VideoFormatInfo;
  error?: string;
}

export interface FilmstripOptions {
  fps?: number;
  width: number;
  frameHeight?: number;
  numFrames?: number;
}

export interface SbsVideoOptions {
  inputVideoUrl: string;
  renderVideoUrl: string;
  startFrame: number;
  endFrame: number;
  fps: number;
  onProgress?: (progress: EncodingProgress) => void;
}

export interface InfoRichVideoOptions {
  renderVideoUrl: string;
  startFrame: number;
  endFrame: number;
  fps: number;
  projectName: string;
  trackName: string;
  engineDisplayName: string;
  controlType?: string;
  prompt?: string;
  imageRefName?: string;
  imageRefUrl?: string;
  onProgress?: (progress: EncodingProgress) => void;
}
