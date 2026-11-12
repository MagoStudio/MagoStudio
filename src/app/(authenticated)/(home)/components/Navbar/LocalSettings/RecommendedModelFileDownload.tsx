import { useModelLicenseAcceptanceGate } from "@app/components/LocalSetupWizard/hooks/useModelLicenseAcceptanceGate";
import { LocalModelLicenseDialog } from "@app/components/LocalSetupWizard/LocalModelLicenseDialog";
import { LocalSetupRequirementDownload } from "@app/components/LocalSetupWizard/LocalSetupRequirementDownload";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { RecommendedModelFile } from "../../../../../../../desktop/shared/modelSettings";

export const RecommendedModelFileDownload = ({
  recommendedFile,
  onModelSaved
}: {
  recommendedFile: RecommendedModelFile;
  onModelSaved: () => void;
}) => {
  const { t } = useTranslation();
  const { startDownloadOnceLicensesAccepted, licenseDialogProps } =
    useModelLicenseAcceptanceGate();
  const { setupDownloadName, sourceUrl } = recommendedFile;
  return (
    <div className="flex flex-col items-start gap-2">
      <Text variant="xs" color="glyph-warning">
        {t("modelSettings.recommendedFileMissing")}
      </Text>
      {setupDownloadName && sourceUrl && (
        <LocalSetupRequirementDownload
          item={{
            name: setupDownloadName,
            url: sourceUrl,
            downloadUrl: sourceUrl,
            installKind: "model",
            status: "missing"
          }}
          startDownloadOnceLicensesAccepted={startDownloadOnceLicensesAccepted}
          onModelSaved={onModelSaved}
        />
      )}
      <LocalModelLicenseDialog {...licenseDialogProps} />
    </div>
  );
};
