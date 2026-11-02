import { AssetStatus } from "@schemas/asset";

export interface QueueItem {
  active: boolean;
  asset_id: string;
  created_at: string;
  display_order?: number;
  ETA?: number;
  error?: {
    error_type: string;
    error_message?: string;
  };
  estimated_end_time?: string;
  finished_at: string;
  interacted_with?: boolean;
  kind?: "image" | "video";
  queue_id: string;
  frame_range: [number, number];
  id: string;
  layer_id: string;
  layer_name: string;
  order: number;
  price: number;
  price_currency?: "USD";
  progress: number;
  project_id: string;
  project_name: string;
  render_started_at: string;
  render_model?: string;
  render_provider?: "local-comfy" | "mago-cloud";
  timeline_id: string;
  timeline_name: string;
  server_error?: object;
  show_done: boolean;
  status: AssetStatus;
  user_id: string;
  isCancelable: boolean;
  local_cloud_render_job_id?: string;
  cloud_asset_id?: string | null;
  cloud_queue_item_id?: string | null;
  cloud_queue_status?: string | null;
  cloud_output_layer_id?: string | null;
}
