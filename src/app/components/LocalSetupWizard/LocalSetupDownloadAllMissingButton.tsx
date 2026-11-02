import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { ScriptSetupRequirement } from "../../../../desktop/shared/contracts";

export const LocalSetupDownloadAllMissingButton = ({
  batchName,
  items,
  debugMissing
}: {
  batchName: string;
  items: ScriptSetupRequirement[];
  debugMissing: boolean;
}) => {
  const { t } = useTranslation();
  const missingNames = items
    .filter((item) => debugMissing || item.status !== "installed")
    .filter((item) => !!item.downloadUrl)
    .map((item) => item.name);
  const downloadAll = useMutation({
    mutationFn: (names: string[]) =>
      window.mago.localSetup.downloadRequirements(batchName, names)
  });
  const pauseBatch = useMutation({
    mutationFn: () => window.mago.localSetup.pauseDownload(batchName)
  });
  const hasMissingFiles = missingNames.length > 0;
  const isDownloadButtonShown = hasMissingFiles || downloadAll.isPending;
  if (!isDownloadButtonShown && downloadAll.isIdle) return null;
  return (
    <div className="flex flex-col items-start gap-1">
      {isDownloadButtonShown && (
        <MainButton
          startIcon={<Icon iconSet="16" iconName="download" />}
          colorScheme="onColor"
          variant="outlined"
          isDisabled={downloadAll.isPending}
          loading={downloadAll.isPending}
          onPress={() => downloadAll.mutate(missingNames)}
        >
          {downloadAll.isPending
            ? t("localSetup.existingComfy.vfxLoras.downloadingAll", {
                count: downloadAll.variables.length
              })
            : downloadAll.isError
              ? t("localSetup.existingComfy.vfxLoras.retry")
              : t("localSetup.existingComfy.vfxLoras.downloadAllMissing", {
                  count: missingNames.length
                })}
        </MainButton>
      )}
      {downloadAll.isPending && (
        <MainButton
          variant="outlined"
          colorScheme="onColor"
          onPress={() => pauseBatch.mutate()}
        >
          {t("localSetup.existingComfy.vfxLoras.pause")}
        </MainButton>
      )}
      {pauseBatch.isError && (
        <Text variant="xs" color="glyph-error">
          {pauseBatch.error.message}
        </Text>
      )}
      {downloadAll.isError && (
        <Text variant="xs" color="glyph-error">
          {downloadAll.error.message}
        </Text>
      )}
      {downloadAll.data && (
        <Text variant="xs" color="success">
          {t("localSetup.existingComfy.vfxLoras.savedTo", {
            folder: downloadAll.data
          })}
        </Text>
      )}
    </div>
  );
};
