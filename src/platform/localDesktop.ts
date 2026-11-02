import type { MagoDesktopApi } from "../../desktop/shared/contracts";

/** Build-time marker; unlike window.mago it is also stable during SSR. */
export const isLocalApp = process.env.NEXT_PUBLIC_MAGO_STUDIO === "true";
export const OPEN_CREDENTIALS_EVENT = "mago:open-credentials";

export const getLocalDesktopApi = (): MagoDesktopApi => {
  if (typeof window === "undefined" || !window.mago) {
    throw new Error("The Mago desktop bridge is unavailable");
  }
  return window.mago;
};
