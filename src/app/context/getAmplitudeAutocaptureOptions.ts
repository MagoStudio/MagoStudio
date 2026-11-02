import {
  isLongFormRunPath,
  LONG_FORM_RUN_PATH_PREFIX
} from "@domains/longFormRun/utils/isLongFormRunPath";

import { API_URL } from "@/lib/backend-api-client";

const LONG_FORM_RUN_PAGE_URL_EXCLUDELIST = [
  new RegExp(LONG_FORM_RUN_PATH_PREFIX)
];

export const getAmplitudeAutocaptureOptions = () => ({
  attribution: true,
  fileDownloads: true,
  formInteractions: true,
  pageViews: {
    trackOn: () => !isLongFormRunPath(window.location.pathname)
  },
  sessions: true,
  elementInteractions: {
    pageUrlExcludelist: LONG_FORM_RUN_PAGE_URL_EXCLUDELIST
  },
  networkTracking: {
    captureRules: [{ hosts: [new URL(API_URL).hostname] }]
  },
  webVitals: true,
  frustrationInteractions: {
    pageUrlExcludelist: LONG_FORM_RUN_PAGE_URL_EXCLUDELIST
  }
});
