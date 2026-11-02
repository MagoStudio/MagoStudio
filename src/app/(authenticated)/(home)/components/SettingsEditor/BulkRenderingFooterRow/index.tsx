import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { useStartBulkRenderingFlow } from "@domains/bulkRendersRun/useStartBulkRenderingFlow";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BulkRenderingInfoPopover } from "../BulkRenderingInfoPopover";

type BulkRenderingFooterRowProps = {
  isApplySettingsDisabled: boolean;
};

export function BulkRenderingFooterRow({
  isApplySettingsDisabled
}: BulkRenderingFooterRowProps) {
  const { t } = useTranslation();
  const [isInfoPopoverOpen, setIsInfoPopoverOpen] = useState(false);
  const startBulkRenderingFlow = useStartBulkRenderingFlow();

  return (
    <>
      <div className="flex w-full shrink-0 items-center gap-2">
        <div className="flex-1 basis-0">
          <MainButton
            colorScheme="secondary"
            fullWidth
            isDisabled={isApplySettingsDisabled}
            onPress={startBulkRenderingFlow}
          >
            {t("bulk_rendering.apply_settings_button.label")}
          </MainButton>
        </div>
        <MainButton
          colorScheme="secondary"
          aria-label={t("bulk_rendering.info_button.ariaLabel")}
          className="h-auto w-10 shrink-0 self-stretch px-3"
          onPress={() => setIsInfoPopoverOpen(true)}
        >
          <Icon iconSet="16-filled" iconName="info" />
        </MainButton>
      </div>
      <BulkRenderingInfoPopover
        isOpen={isInfoPopoverOpen}
        onOpenChange={setIsInfoPopoverOpen}
      />
    </>
  );
}
