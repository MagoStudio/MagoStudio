import { CloseButton } from "@components/CloseButton";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
import { resolveSheetGroupPreviewImage } from "@domains/scriptProject/utils/resolveSheetGroupPreviewImage";
import { getTagCategoryForSheetKind } from "@domains/scriptProject/utils/shotTagCategories";
import { SheetGroup } from "@schemas/scriptProject";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

const DIALOG_INSET_X_PX = 32;
const DIALOG_INSET_Y_PX = 56;

type Props = {
  sheetGroups: SheetGroup[];
  taggedTokens: string[];
  isBusy: boolean;
  onAddReference: (group: SheetGroup) => void;
};

export const ShotAddReferenceControl: React.FC<Props> = ({
  sheetGroups,
  taggedTokens,
  isBusy,
  onAddReference
}) => {
  const { t } = useTranslation();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const addableGroups = sheetGroups.filter(
    (group) =>
      group.enabled &&
      !!getTagCategoryForSheetKind(group.kind) &&
      !taggedTokens.includes(group.token)
  );

  if (addableGroups.length === 0) return null;

  return (
    <>
      <GhostButton
        colorScheme="stroke"
        aria-label={t("script_project.add_reference_button.label")}
        isDisabled={isBusy}
        onPress={() => setIsPickerOpen(true)}
        data-testid="shot-add-reference"
        className="h-[50px] w-full border-dashed bg-element-primary"
        startIcon={<Icon iconSet="16" iconName="plus" />}
      />

      <OverlayDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        size={{
          mode: "inset",
          insetXPx: DIALOG_INSET_X_PX,
          insetYPx: DIALOG_INSET_Y_PX
        }}
        className="overflow-hidden"
      >
        <div className="relative flex h-full w-full flex-col gap-6 p-8">
          <div className="absolute right-4 top-4">
            <CloseButton onPress={() => setIsPickerOpen(false)} />
          </div>

          <Text component="h4" variant="xl" weight="semibold">
            {t("script_project.add_reference_button.label")}
          </Text>

          <div
            className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-4 overflow-y-auto scrollbar-custom sm:grid-cols-4 lg:grid-cols-6"
            data-testid="shot-add-reference-options"
          >
            {addableGroups.map((group) => {
              const previewImageUrl = resolveSheetGroupPreviewImage(group);

              return (
                <AriaButton
                  key={group.token}
                  isDisabled={isBusy}
                  onPress={() => {
                    onAddReference(group);
                    setIsPickerOpen(false);
                  }}
                  data-testid={`shot-add-reference-option-${group.token}`}
                  className="flex flex-col gap-2 rounded-xl border border-element-primary bg-surface-primary p-2 text-left outline-hidden data-[hovered]:border-glyph-action-main data-[focus-visible]:border-glyph-action-main data-[disabled]:opacity-50"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-element-primary">
                    {previewImageUrl ? (
                      <img
                        src={toDesktopCloudStorageUrl(previewImageUrl)}
                        alt={group.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon
                          iconSet="24"
                          iconName="broken-image"
                          className="text-glyph-tertiary"
                        />
                      </div>
                    )}
                  </div>
                  <Text component="span" variant="xs" className="truncate">
                    {group.name}
                  </Text>
                </AriaButton>
              );
            })}
          </div>
        </div>
      </OverlayDialog>
    </>
  );
};
