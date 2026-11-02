import { ImageThumbnail } from "@components/ImageThumbnail";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { isFocusMovingToDraftSavingAction } from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { useState } from "react";
import { FileTrigger } from "react-aria-components/FileTrigger";
import { useTranslation } from "react-i18next";

export const MAX_SHEET_GROUP_REFERENCE_IMAGES = 3;
export const getSheetGroupReferenceLimit = (masterToken?: string | null) =>
  masterToken
    ? MAX_SHEET_GROUP_REFERENCE_IMAGES - 1
    : MAX_SHEET_GROUP_REFERENCE_IMAGES;

const ReferencePreview: React.FC<{
  assetId: string;
  isDisabled: boolean;
  onRemove: () => void;
}> = ({ assetId, isDisabled, onRemove }) => {
  const { data: image, isLoading } = useImageAsset({ assetId });
  const name = image?.asset.name ?? assetId;
  return (
    <div
      className="flex w-36 flex-col gap-1"
      data-testid={`sheet-reference-${assetId}`}
    >
      <ImageThumbnail
        src={image?.urlToUse}
        name={name}
        alt={name}
        isLoading={isLoading}
        isReadOnly={isDisabled}
        imageObjectFit="cover"
        onDelete={isDisabled ? undefined : onRemove}
      />
      <Text variant="2xs" className="truncate" color="glyph-tertiary">
        {name}
      </Text>
    </div>
  );
};

type Props = {
  token: string;
  limit: number;
  assetIds: string[];
  instruction: string;
  isDisabled: boolean;
  onChange: (ids: string[], instruction: string) => void;
  onCommit: () => void;
  onUpload: (file: File) => Promise<string | undefined>;
};

export const SheetGroupReferences: React.FC<Props> = ({
  token,
  limit,
  assetIds,
  instruction,
  isDisabled,
  onChange,
  onCommit,
  onUpload
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-primary p-3">
      <Text variant="xs" weight="semibold">
        {t("script_project.asset_references.label")}
      </Text>
      <Text variant="2xs" color="glyph-tertiary">
        {t("script_project.asset_references.hint", { count: limit })}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        {assetIds.map((assetId) => (
          <ReferencePreview
            key={assetId}
            assetId={assetId}
            isDisabled={isDisabled || isUploading}
            onRemove={() => {
              const next = assetIds.filter((id) => id !== assetId);
              onChange(next, next.length ? instruction : "");
            }}
          />
        ))}
        <FileTrigger
          acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
          onSelect={(files) => {
            const file = files?.[0];
            if (!file || isDisabled || isUploading || assetIds.length >= limit)
              return;
            setIsUploading(true);
            void onUpload(file)
              .then((id) => {
                if (id && !assetIds.includes(id))
                  onChange([...assetIds, id], instruction);
              })
              .finally(() => setIsUploading(false));
          }}
        >
          <MainButton
            size="sm"
            colorScheme="secondary"
            isDisabled={isDisabled || isUploading || assetIds.length >= limit}
            data-testid={`sheet-group-add-reference-${token}`}
          >
            {t("script_project.asset_references.add")}
          </MainButton>
        </FileTrigger>
      </div>
      {assetIds.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.asset_references.instruction")}
          </Text>
          <Textarea
            className="min-h-16"
            autoResize
            resize="vertical"
            maxLength={8000}
            value={instruction}
            disabled={isDisabled || isUploading}
            onChange={(event) => onChange(assetIds, event.target.value)}
            onBlur={(event) => {
              if (!isFocusMovingToDraftSavingAction(event.relatedTarget))
                onCommit();
            }}
            data-testid={`sheet-group-reference-instruction-${token}`}
          />
        </label>
      )}
    </div>
  );
};
