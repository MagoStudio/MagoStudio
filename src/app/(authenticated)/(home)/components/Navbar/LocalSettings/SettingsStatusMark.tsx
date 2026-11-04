import { LocalSetupStatusMark } from "@app/components/LocalSetupWizard/LocalSetupStatusMark";
import { CircularProgress } from "@components/CircularProgress";
import { useTranslation } from "react-i18next";

export const SettingsStatusMark = ({
  ready,
  label
}: {
  ready: boolean | null;
  label: string;
}) => {
  const { t } = useTranslation();
  const statusLabelKey =
    ready === null
      ? "localSettings.statusMark.checking"
      : ready
        ? "localSettings.statusMark.ready"
        : "localSettings.statusMark.needsAttention";

  return (
    <span aria-label={t(statusLabelKey, { label })}>
      {ready === null ? (
        <CircularProgress
          size="xs"
          aria-label={t("localSettings.statusMark.checkingProgress", { label })}
        />
      ) : (
        <LocalSetupStatusMark outcome={ready ? "success" : "error"} />
      )}
    </span>
  );
};
