import { Text } from "@components/Text";
import { useVersion } from "@domains/app/useVersion";
import { useTranslation } from "react-i18next";

import { COMMIT_HASH, SHORT_HASH_LENGTH } from "@/platform/buildInfo";

export function LocalAppVersion() {
  const { t } = useTranslation();
  const { data: versionData } = useVersion();

  if (!versionData?.version) return null;

  return (
    <Text variant="2xs" color="glyph-tertiary" className="select-text">
      {t("titles.local_app_version.label", {
        version: versionData.version,
        commitHash: COMMIT_HASH.slice(0, SHORT_HASH_LENGTH)
      })}
    </Text>
  );
}
