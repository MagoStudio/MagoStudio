import { isAxiosError } from "axios";

const HTTP_NOT_FOUND = 404;

export const isCloudResourceAlreadyGoneError = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === HTTP_NOT_FOUND;
