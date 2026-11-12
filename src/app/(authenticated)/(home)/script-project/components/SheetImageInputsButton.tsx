import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Popover } from "@components/Popover";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { SheetImageInputsPanel } from "./SheetImageInputsPanel";

type Props = React.ComponentProps<typeof SheetImageInputsPanel>;

export const SheetImageInputsButton: React.FC<Props> = ({
  onReuseSettings,
  ...panelProps
}) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <IconActionButton
        aria-label={t("script_project.show_image_inputs_button.ariaLabel")}
        icon={<Icon iconSet="16" iconName="info" />}
        className="text-glyph-tertiary"
        data-testid={`sheet-image-inputs-button-${panelProps.image.asset_id}`}
      />

      <Popover placement="bottom" isNonModal={false} variant="neutral">
        <SheetImageInputsPanel
          {...panelProps}
          onReuseSettings={(versionSettings) => {
            onReuseSettings(versionSettings);
            setIsPopoverOpen(false);
          }}
        />
      </Popover>
    </DialogTrigger>
  );
};
