import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { backendApiClient } from "@/lib/backend-api-client";

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_PRECONDITION_FAILED = 412;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

interface PublishVideoIngestionJobError {
  error: string;
}

interface PublishVideoIngestionJobSuccess {
  message: string;
  job_id: string;
}

type PublishVideoIngestionJobResponse =
  | PublishVideoIngestionJobSuccess
  | PublishVideoIngestionJobError;

const publishVideoIngestionJob = async (
  assetId: string
): Promise<PublishVideoIngestionJobResponse> => {
  try {
    const response = await backendApiClient.post(
      `/assets/${assetId}/ingestion`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === HTTP_STATUS_BAD_REQUEST) {
        return { error: "Invalid asset type" };
      }
      if (error.response?.status === HTTP_STATUS_NOT_FOUND) {
        return { error: "User/Asset not found" };
      }
      if (error.response?.status === HTTP_STATUS_PRECONDITION_FAILED) {
        return { error: error.response.data.error };
      }
      if (error.response?.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return { error: "Failed to push ingestion job to queue" };
      }
    }
    return { error: "An unexpected error occurred" };
  }
};

export const usePublishVideoIngestionJob = () => {
  return useMutation({
    mutationFn: publishVideoIngestionJob
  });
};
