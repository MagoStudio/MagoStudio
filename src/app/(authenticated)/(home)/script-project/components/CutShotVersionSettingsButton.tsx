import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Popover } from "@components/Popover";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { CutShotVersionSettingsPanel } from "./CutShotVersionSettingsPanel";

type Props = React.ComponentProps<typeof CutShotVersionSettingsPanel> & {
  className?: string;
};

export const CutShotVersionSettingsButton: React.FC<Props> = ({
  className,
  onReuseSettings,
  ...panelProps
}) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <IconActionButton
        className={className}
        aria-label={t("script_project.show_image_inputs_button.ariaLabel")}
        icon={<Icon iconSet="16" iconName="info" />}
        data-testid={`cut-version-settings-button-${panelProps.version.asset_id}`}
      />

      <Popover placement="bottom" isNonModal={false} variant="neutral">
        <CutShotVersionSettingsPanel
          {...panelProps}
          onReuseSettings={(version) => {
            onReuseSettings(version);
            setIsPopoverOpen(false);
          }}
        />
      </Popover>
    </DialogTrigger>
  );
};
