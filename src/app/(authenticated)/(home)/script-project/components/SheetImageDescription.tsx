import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { useEditAssetDescription } from "@domains/asset/useEditAssetDescription";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SheetImageDescriptionBody } from "./SheetImageDescriptionBody";

type Props = {
  assetId: string;
  description: string | null | undefined;
  hasDescription: boolean;
  seedDescription: string;
  isBusy: boolean;
  onDescribeFromImage: () => void;
};

export const SheetImageDescription: React.FC<Props> = ({
  assetId,
  description,
  hasDescription,
  seedDescription,
  isBusy,
  onDescribeFromImage
}) => {
  const { t } = useTranslation();
  const { mutate: editDescription, isPending: isSavingDescription } =
    useEditAssetDescription();
  const [draftDescription, setDraftDescription] = useState<string | null>(null);

  const savedDescription = hasDescription ? (description ?? "") : "";
  const descriptionToEdit = hasDescription ? savedDescription : seedDescription;
  const isEditing = draftDescription !== null;

  const commitDescription = () => {
    if (draftDescription === null) return;

    const isDescriptionUnchanged = draftDescription === descriptionToEdit;
    if (isDescriptionUnchanged) {
      setDraftDescription(null);
      return;
    }

    editDescription(
      { assetId, description: draftDescription },
      { onSuccess: () => setDraftDescription(null) }
    );
  };

  return (
    <div
      className="flex flex-col gap-1.5 border-t border-element-primary pt-2"
      data-testid={`sheet-image-description-${assetId}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Text variant="xs" weight="semibold" color="glyph-secondary">
          {t("script_project.image_description_title.label")}
        </Text>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <MainButton
              size="sm"
              colorScheme="secondary"
              isDisabled={isBusy}
              onPress={onDescribeFromImage}
              data-testid={`sheet-image-describe-${assetId}`}
            >
              {t("script_project.describe_entity_button.label")}
            </MainButton>
            <MainButton
              size="sm"
              colorScheme="secondary"
              isDisabled={isBusy}
              onPress={() => setDraftDescription(descriptionToEdit)}
              data-testid={`sheet-image-edit-description-${assetId}`}
            >
              {t("script_project.edit_description_button.label")}
            </MainButton>
          </div>
        )}
      </div>

      {isEditing ? (
        <Textarea
          className="min-h-16"
          resize="vertical"
          autoFocus
          value={draftDescription}
          disabled={isSavingDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          onBlur={commitDescription}
          onKeyDown={(event) => {
            if (event.key === "Escape") setDraftDescription(null);
          }}
          data-testid={`sheet-image-description-input-${assetId}`}
        />
      ) : (
        <SheetImageDescriptionBody
          hasBeenDescribed={hasDescription}
          description={savedDescription}
          inheritedDescription={seedDescription}
        />
      )}
    </div>
  );
};
