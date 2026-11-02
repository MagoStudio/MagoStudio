import { readAxiosErrorBody } from "@domains/renders/utils/readAxiosErrorBody";
import { HttpStatusCode } from "axios";

export type CloudRequestFailure =
  | { kind: "transient" }
  | { kind: "rejected"; httpStatus: number; reason: string };

const TRANSIENT_HTTP_STATUSES = new Set<number>([
  HttpStatusCode.Unauthorized,
  HttpStatusCode.RequestTimeout,
  HttpStatusCode.TooEarly,
  HttpStatusCode.TooManyRequests,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout
]);

const readErrorResponse = (
  error: unknown
): { status?: unknown; data?: unknown } | null => {
  if (typeof error !== "object" || error === null) return null;
  const response = (error as { response?: unknown }).response;
  if (typeof response !== "object" || response === null) return null;
  return response as { status?: unknown; data?: unknown };
};

export const classifyCloudRequestFailure = (
  error: unknown
): CloudRequestFailure => {
  const response = readErrorResponse(error);
  const httpStatus = response?.status;
  if (typeof httpStatus !== "number") return { kind: "transient" };
  if (TRANSIENT_HTTP_STATUSES.has(httpStatus)) return { kind: "transient" };
  return {
    kind: "rejected",
    httpStatus,
    reason: readAxiosErrorBody(response?.data)
  };
};
