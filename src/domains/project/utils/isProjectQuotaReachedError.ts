import { isAxiosError } from "axios";

const HTTP_TOO_MANY_REQUESTS = 429;

export const isProjectQuotaReachedError = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === HTTP_TOO_MANY_REQUESTS;
