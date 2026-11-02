export type CacheType = "video" | "image" | "filmstrip" | "frame";

type OPFSOperation = "write" | "read" | "clear";

export interface OPFSRequest {
  id: string;
  operation: OPFSOperation;
  cacheType: CacheType;
  key?: string;
  data?: ArrayBuffer;
}

export interface OPFSResponse {
  id: string;
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}
