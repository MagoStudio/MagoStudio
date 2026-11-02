import { Text } from "@components/Text";
import { useVersion } from "@domains/app/useVersion";
import { useTranslation } from "react-i18next";

import {
  BUILD_TIMESTAMP,
  COMMIT_HASH,
  SHORT_HASH_LENGTH
} from "@/platform/buildInfo";

import { buildAppSectionCopyText } from "./buildAppSectionCopyText";
import {
  BACKEND_URL,
  FEATURE_FLAGS,
  VERSION_ROW_LABEL_KEY
} from "./debugInfoAppConstants";
import { DebugInfoRow } from "./DebugInfoRow";
import { DebugInfoSection } from "./DebugInfoSection";
import { formatTimestamp } from "./formatTimestamp";
import { getBrowserInfo } from "./getBrowserInfo";

export function DebugInfoAppSection() {
  const { t } = useTranslation();
  const { data: versionData } = useVersion();

  const shortHash = COMMIT_HASH.slice(0, SHORT_HASH_LENGTH);
  const appVersion = versionData?.version || "—";
  const copyText = buildAppSectionCopyText(t, appVersion);

  return (
    <DebugInfoSection
      title={t("titles.app_environment.label")}
      copyText={copyText}
    >
      <DebugInfoRow label={t("titles.commit_hash.label")} value={shortHash} />
      <DebugInfoRow
        label={t("titles.build_time.label")}
        value={formatTimestamp(BUILD_TIMESTAMP)}
      />
      <DebugInfoRow label={t("titles.backend_url.label")} value={BACKEND_URL} />
      <DebugInfoRow label={t(VERSION_ROW_LABEL_KEY)} value={appVersion} />

      <div className="mt-1">
        <Text
          variant="2xs"
          weight="medium"
          color="glyph-tertiary"
          className="mb-0.5"
        >
          {t("titles.feature_flags.label")}
        </Text>
        {Object.entries(FEATURE_FLAGS).map(([name, val]) => {
          const isOn = val === "true";
          return (
            <div key={name} className="flex justify-between gap-2">
              <Text variant="2xs" color="glyph-tertiary">
                {name}
              </Text>
              <Text
                variant="2xs"
                color={isOn ? "glyph-action-main" : "glyph-tertiary"}
              >
                {isOn ? "ON" : "OFF"}
              </Text>
            </div>
          );
        })}
      </div>

      <div className="mt-1">
        <DebugInfoRow
          label={t("titles.browser_info.label")}
          value={getBrowserInfo()}
        />
      </div>
    </DebugInfoSection>
  );
}
