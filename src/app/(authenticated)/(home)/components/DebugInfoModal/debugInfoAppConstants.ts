import { isLocalApp } from "@/platform/localDesktop";

import { toVersionRowLabelKey } from "./toVersionRowLabelKey";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const FEATURE_FLAGS = {
  Interpolation: process.env.NEXT_PUBLIC_MAGOV2_INTERPOLATION_FEATURE,
  "Long Context": process.env.NEXT_PUBLIC_MAGOV2_LONG_CONTEXT_FEATURE
};

export const VERSION_ROW_LABEL_KEY = toVersionRowLabelKey(isLocalApp);
