import { useRouter } from "next/navigation";

import { useMountEffect } from "./useMountEffect";

const REDIRECT_CAP_MS = 5000;

export const useRedirectCap = () => {
  const router = useRouter();

  useMountEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/");
    }, REDIRECT_CAP_MS);

    return () => clearTimeout(timeout);
  });
};
