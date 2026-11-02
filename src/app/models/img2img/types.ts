import { SettingsGroup } from "../shared/types";

export enum Img2ImgRenderStatus {
  CANCELLED = "cancelled",
  CREATED = "created",
  FAILED = "failed",
  NOT_STARTED = "not-started",
  QUEUED = "queued",
  RUNNING = "running",
  STARTED = "started",
  SUCCESS = "success",
  TIMEOUT = "timeout",
  UPLOADING = "uploading"
}

export interface Img2ImgSettings {
  render_model: string | undefined;
  reference_images: string[];
  input_image?: string;
  input_image_id?: string;
  width: number;
  height: number;
  [key: string]: any;
}

export interface Img2ImgRenderResponse {
  id: string;
  timeline_id: string;
  type: string;
  user_id: string;
  clips: Array<{
    id: string;
    data: {
      source: string;
      frame: number;
      render_job_id?: string;
      settings: Img2ImgSettings;
      status: "created";
    };
    asset: {
      id: string;
      type: string;
      filepath: string;
    };
  }>;
}

export interface Image2ImageModelDefinition {
  name: string;
  displayName: string;
  subtitle?: string;
  type: string;
  status: string;
  tabs: Array<SettingsGroup>;
  computeCost: (watchedValues: Img2ImgSettings) => number | null;
}
