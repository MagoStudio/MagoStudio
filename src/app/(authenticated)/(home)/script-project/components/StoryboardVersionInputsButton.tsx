import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Popover } from "@components/Popover";
import { DialogTrigger } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { StoryboardVersionInputsPanel } from "./StoryboardVersionInputsPanel";

type Props = React.ComponentProps<typeof StoryboardVersionInputsPanel> & {
  testId: string;
};

export const StoryboardVersionInputsButton: React.FC<Props> = ({
  testId,
  ...panelProps
}) => {
  const { t } = useTranslation();
  return (
    <DialogTrigger>
      <IconActionButton
        aria-label={t("script_project.show_image_inputs_button.ariaLabel")}
        icon={<Icon iconSet="16" iconName="info" />}
        className="text-glyph-tertiary"
        data-testid={testId}
      />
      <Popover placement="bottom" isNonModal={false} variant="neutral">
        <StoryboardVersionInputsPanel {...panelProps} />
      </Popover>
    </DialogTrigger>
  );
};
