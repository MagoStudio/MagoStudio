import axios from "axios";

import {
  HTTP_PAYMENT_REQUIRED,
  INSUFFICIENT_BALANCE_RENDER_MESSAGE
} from "./insufficientBalanceRenderMessage";
import { readAxiosErrorBody } from "./readAxiosErrorBody";

export const extractRenderErrorMessage = (
  error: unknown
): string | undefined => {
  if (!axios.isAxiosError(error)) return undefined;
  if (error.response?.status === HTTP_PAYMENT_REQUIRED) {
    return INSUFFICIENT_BALANCE_RENDER_MESSAGE;
  }
  const message = readAxiosErrorBody(error.response?.data);
  return message || undefined;
};
