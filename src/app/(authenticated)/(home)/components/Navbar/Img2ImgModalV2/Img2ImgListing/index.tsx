import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useImg2ImgHistoryClips } from "@domains/track/useImg2ImgHistoryClips";
import { cn } from "@utils";
import React from "react";
import { Button } from "react-aria-components/Button";
import { DisclosurePanel, Disclosure } from "react-aria-components/Disclosure";
import { Heading } from "react-aria-components/Heading";

import { ClipListItem } from "./ClipListItem";

type Props = {
  onClipClick?: (clipId: string) => void;
};

export const Img2ImgListing: React.FC<Props> = ({ onClipClick }) => {
  const {
    data: { groupedClips }
  } = useImg2ImgHistoryClips();

  const handleClipClick = (clipId: string) => {
    onClipClick?.(clipId);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-custom px-5 py-4">
      <div className="flex-1 flex flex-col">
        {Object.entries(groupedClips).map(([key, frameClips]) => (
          <Disclosure key={key} id={key}>
            {({ isExpanded }) => (
              <>
                <Heading>
                  <Button
                    slot="trigger"
                    className="flex items-center justify-between w-full"
                  >
                    <Text
                      variant="md"
                      color="glyph-secondary"
                      className="px-2 py-3"
                    >
                      Frame {key}
                    </Text>
                    <Icon
                      iconSet="16"
                      iconName="chevron-down"
                      className={cn(
                        "transition-transform duration-[400ms] ease-[cubic-bezier(0.33,1,0.6,1)]",
                        isExpanded && "-rotate-180"
                      )}
                    />
                  </Button>
                </Heading>
                <DisclosurePanel className="px-0 py-0 w-full">
                  <div
                    className="flex flex-col py-2"
                    style={{ contentVisibility: "auto" }}
                  >
                    {frameClips.toReversed().map((clip, index) => (
                      <ClipListItem
                        key={clip.id}
                        clip={clip}
                        onClipClick={handleClipClick}
                        frameNumber={Number(key)}
                        index={frameClips.length - 1 - index}
                        isExpanded={isExpanded}
                      />
                    ))}
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
};
