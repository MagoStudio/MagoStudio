import { atom } from "jotai";

export type BulkUploadFileStatus =
  | "pending"
  | "validating"
  | "uploading"
  | "ingesting"
  | "completed"
  | "error"
  | "cancelled";

export interface BulkUploadFileItem {
  id: string;
  file: File;
  fileName: string;
  status: BulkUploadFileStatus;
  progress: number;
  errorMessage?: string;
  projectId?: string;
}

export interface BulkUploadState {
  isUploadInProgress: boolean;
  files: BulkUploadFileItem[];
  targetFolderId: string;
  isPanelVisible: boolean;
}

const DEFAULT_BULK_UPLOAD_STATE: BulkUploadState = {
  isUploadInProgress: false,
  files: [],
  targetFolderId: "",
  isPanelVisible: false
};

export const bulkUploadAtom = atom<BulkUploadState>(DEFAULT_BULK_UPLOAD_STATE);
