import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const LocalSettingsDebugTab = ({ endpoint }: { endpoint: string }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const query = useQuery({
    queryKey: ["model-diagnostics", endpoint],
    queryFn: () => window.mago.models.diagnostics(endpoint),
    staleTime: 60_000,
    retry: false
  });
  const report = query.data ? JSON.stringify(query.data, null, 2) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Text variant="sm" weight="bold">
          {t("modelSettings.supportReport")}
        </Text>
        <IconActionButton
          aria-label={t("modelSettings.copyReport")}
          title={t("modelSettings.copyReport")}
          icon={<Icon iconSet="16" iconName="copy" />}
          isDisabled={!report || query.isFetching}
          onPress={() => void copy()}
        />
      </div>
      <Text variant="2xs" color="glyph-tertiary">
        {t("modelSettings.debugHint")}
      </Text>
      {query.isFetching && (
        <Text variant="xs" color="glyph-tertiary">
          {t("modelSettings.checking")}
        </Text>
      )}
      {query.error && (
        <Text variant="xs" color="glyph-error">
          {query.error.message}
        </Text>
      )}
      {report && (
        <textarea
          aria-label={t("modelSettings.supportReport")}
          readOnly
          value={report}
          className="min-h-0 w-full flex-1 resize-none rounded border border-element-primary bg-surface-primary p-3 font-mono text-2xs text-glyph-secondary outline-hidden focus-visible:border-glyph-action-main"
        />
      )}
      {copied && (
        <Text variant="xs" color="glyph-success">
          {t("modelSettings.copied")}
        </Text>
      )}
      {copyError && (
        <Text variant="xs" color="glyph-warning">
          {t("modelSettings.copyFallback")}
        </Text>
      )}
      <MainButton
        size="sm"
        colorScheme="secondary"
        isDisabled={query.isFetching}
        onPress={() => {
          setCopied(false);
          void query.refetch();
        }}
      >
        {t("modelSettings.refresh")}
      </MainButton>
    </div>
  );
};
