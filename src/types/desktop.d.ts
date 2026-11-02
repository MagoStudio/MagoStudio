import type { MagoDesktopApi } from "../../desktop/shared/contracts";

declare global {
  interface Window {
    mago: MagoDesktopApi;
  }
}

export {};
