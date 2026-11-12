import { CircularProgress } from "@components/CircularProgress";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useState } from "react";
import { Button } from "react-aria-components/Button";
import { DropZone } from "react-aria-components/DropZone";
import { FileTrigger } from "react-aria-components/FileTrigger";
import { FileDropItem } from "react-aria-components/GridList";
import { useTranslation } from "react-i18next";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type Props = {
  onFileChosen: (file: File) => void;
  isBusy: boolean;
  isUploadingImage?: boolean;
  /** Match the sibling cards so the tile sits in the strip rather than beside it. */
  className?: string;
  testId?: string;
};

export const AddImageDropTile: React.FC<Props> = ({
  onFileChosen,
  isBusy,
  isUploadingImage = false,
  className,
  testId
}) => {
  const { t } = useTranslation();
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isImageDropDisabled = isBusy || isUploadingImage;

  return (
    <DropZone
      isDisabled={isImageDropDisabled}
      getDropOperation={(types) =>
        ACCEPTED_IMAGE_TYPES.some((type) => types.has(type)) ? "copy" : "cancel"
      }
      onDropEnter={() => setIsDropTarget(true)}
      onDropExit={() => setIsDropTarget(false)}
      onDrop={(event) => {
        setIsDropTarget(false);
        const dropped = event.items.find(
          (item): item is FileDropItem =>
            item.kind === "file" && ACCEPTED_IMAGE_TYPES.includes(item.type)
        );
        if (dropped) void dropped.getFile().then(onFileChosen);
      }}
      data-testid={testId}
      className={cn(
        "flex flex-col rounded-xl border border-dashed outline-hidden transition-colors",
        isDropTarget
          ? "border-glyph-action-main bg-element-primary-active"
          : "border-element-primary",
        isImageDropDisabled && "opacity-60",
        className
      )}
    >
      <FileTrigger
        acceptedFileTypes={ACCEPTED_IMAGE_TYPES}
        onSelect={(files) => {
          const file = files?.[0];
          if (file) onFileChosen(file);
        }}
      >
        <Button
          isDisabled={isImageDropDisabled}
          className="flex h-full w-full flex-1 flex-col items-center justify-center gap-1 rounded-xl outline-hidden"
        >
          {isUploadingImage ? (
            <CircularProgress size="md" color="glyph-secondary" />
          ) : (
            <>
              <Text
                component="span"
                variant="xl"
                color="glyph-tertiary"
                aria-hidden
              >
                +
              </Text>
              <Text component="span" variant="2xs" color="glyph-tertiary">
                {t("script_project.drop_image_hint.label")}
              </Text>
            </>
          )}
        </Button>
      </FileTrigger>
    </DropZone>
  );
};
