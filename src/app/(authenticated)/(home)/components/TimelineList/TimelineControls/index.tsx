import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { currentVideoFrameAtom } from "@store/atoms";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { CurrentFrameInput } from "../../CurrentFrameInput";

import { RangeInput } from "./RangeInput";
import { useFrameKeyboardNavigation } from "./useFrameKeyboardNavigation";

type Props = {
  className?: string;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const TimelineControls: React.FC<Props> = ({ className, disabled }) => {
  const { t } = useTranslation();
  const handleFrameNavigation = useFrameKeyboardNavigation();

  const handleClickLeft = () => {
    handleFrameNavigation("left");
  };
  const handleClickRight = () => {
    handleFrameNavigation("right");
  };

  const [currentFrame, setCurrentFrame] = useAtom(currentVideoFrameAtom);

  return (
    <div className="flex items-center justify-between pl-1.5 pr-3 w-full">
      <div className="flex gap-0.5 items-center">
        <IconActionButton
          aria-label="Previous Frame"
          icon={<Icon iconSet="16" iconName="chevron-left" />}
          variant="dark"
          className="rounded-tr-none rounded-br-none h-8"
          onPress={handleClickLeft}
        />
        <CurrentFrameInput
          disabled={disabled}
          className="rounded-none!"
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
        />
        <IconActionButton
          aria-label="Next Frame"
          icon={<Icon iconSet="16" iconName="chevron-right" />}
          variant="dark"
          className="rounded-tl-none rounded-bl-none h-8"
          onPress={handleClickRight}
        />
      </div>

      <div className="flex items-center grow gap-1 ml-4">
        <Text
          className="mr-1"
          color="glyph-secondary"
          component="span"
          select="none"
          variant="xs"
        >
          {t("actions.select_range.label")}
        </Text>
        <RangeInput disabled={disabled} />
      </div>
    </div>
  );
};
