import { useModelLicenseAcceptanceGate } from "@app/components/LocalSetupWizard/hooks/useModelLicenseAcceptanceGate";
import { LocalModelLicenseDialog } from "@app/components/LocalSetupWizard/LocalModelLicenseDialog";
import { LocalSetupComfyRestartPrompt } from "@app/components/LocalSetupWizard/LocalSetupComfyRestartPrompt";
import { LocalSetupRequirementDownload } from "@app/components/LocalSetupWizard/LocalSetupRequirementDownload";
import { groupSetupRequirements } from "@app/components/LocalSetupWizard/utils/groupSetupRequirements";
import { Text } from "@components/Text";
import { useState } from "react";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

import type { ScriptSetupRequirement } from "../../../../../../../desktop/shared/contracts";

export const MissingModelNodes = ({
  heading,
  hint,
  missingNodes,
  onComfyRestarted
}: {
  heading: string;
  hint: string;
  missingNodes: ScriptSetupRequirement[];
  onComfyRestarted: () => void;
}) => {
  const { t } = useTranslation();
  const { startDownloadOnceLicensesAccepted, licenseDialogProps } =
    useModelLicenseAcceptanceGate();
  const [isComfyRestartNeeded, setIsComfyRestartNeeded] = useState(false);
  return (
    <section
      className="flex flex-col gap-2 rounded border border-element-primary p-3"
      data-testid="missing-model-nodes"
    >
      <Text variant="sm" weight="bold" color="glyph-warning">
        {heading}
      </Text>
      <Text variant="2xs" color="glyph-tertiary">
        {hint}
      </Text>
      {groupSetupRequirements(missingNodes, false).map(({ item, names }) => (
        <div key={item.url} className="flex flex-col gap-1 wrap-anywhere">
          <AriaLink
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-glyph-action-main underline"
          >
            {item.installKind === "core"
              ? t("modelSettings.updateComfyUi")
              : item.url.split("/").at(-1)}
          </AriaLink>
          <Text variant="xs" color="glyph-secondary">
            {t("modelSettings.missingNodeNames", { names: names.join(", ") })}
          </Text>
          <LocalSetupRequirementDownload
            item={item}
            startDownloadOnceLicensesAccepted={
              startDownloadOnceLicensesAccepted
            }
            onNodePackInstalled={() => setIsComfyRestartNeeded(true)}
          />
        </div>
      ))}
      {isComfyRestartNeeded && (
        <LocalSetupComfyRestartPrompt onRestarted={onComfyRestarted} />
      )}
      <LocalModelLicenseDialog {...licenseDialogProps} />
    </section>
  );
};
