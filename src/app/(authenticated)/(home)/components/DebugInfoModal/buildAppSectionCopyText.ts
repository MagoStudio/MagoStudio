import { BUILD_TIMESTAMP, COMMIT_HASH } from "@/platform/buildInfo";

import {
  BACKEND_URL,
  FEATURE_FLAGS,
  VERSION_ROW_LABEL_KEY
} from "./debugInfoAppConstants";
import { formatTimestamp } from "./formatTimestamp";
import { getBrowserInfo } from "./getBrowserInfo";

export function buildAppSectionCopyText(
  t: (key: string) => string,
  appVersion: string
): string {
  return [
    `## ${t("titles.app_environment.label")}`,
    `${t("titles.commit_hash.label")}: ${COMMIT_HASH}`,
    `${t("titles.build_time.label")}: ${formatTimestamp(BUILD_TIMESTAMP)}`,
    `${t("titles.backend_url.label")}: ${BACKEND_URL}`,
    `${t(VERSION_ROW_LABEL_KEY)}: ${appVersion}`,
    "",
    `${t("titles.feature_flags.label")}:`,
    ...Object.entries(FEATURE_FLAGS).map(
      ([name, val]) => `  ${name}: ${val === "true" ? "ON" : "OFF"}`
    ),
    "",
    `${t("titles.browser_info.label")}: ${getBrowserInfo()}`,
    `${t("titles.user_agent.label")}: ${typeof navigator !== "undefined" ? navigator.userAgent : "—"}`
  ].join("\n");
}
