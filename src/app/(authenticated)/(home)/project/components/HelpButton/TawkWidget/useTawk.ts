/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Tawk_API?: {
      embedded?: string;
      onLoad?: () => void;
      showWidget?: () => void;
      hideWidget?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export const useTawkTo = ({ showChat = false }: { showChat?: boolean }) => {
  const [isTawkReady, setIsTawkReady] = useState(
    () => typeof window !== "undefined" && !!window.Tawk_API?.showWidget
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (window.mago) return;

    if (window.Tawk_API?.showWidget) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.embedded = "tawk_68d13ab389caa6192613d3f0";
    window.Tawk_API.onLoad = () => setIsTawkReady(true);

    if (window.Tawk_LoadStart) return;

    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://embed.tawk.to/68d13ab389caa6192613d3f0/1j5okqjpo";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }, []);

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- syncs React state to the external tawk widget; showWidget/hideWidget can only fire once the async API is ready */
  useEffect(() => {
    if (window.mago) return;
    if (!isTawkReady || !window.Tawk_API) return;

    if (showChat) {
      window.Tawk_API.showWidget?.();
    } else {
      window.Tawk_API.hideWidget?.();
    }
  }, [isTawkReady, showChat]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */
};
