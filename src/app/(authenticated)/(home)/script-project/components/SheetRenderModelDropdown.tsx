import { Dropdown } from "@components/Dropdown";
import { Text } from "@components/Text";
import {
  AnySheetRenderModel,
  LocalSheetRenderModel,
  LOCAL_SHEET_RENDER_MODELS,
  SHEET_RENDER_MODELS,
  isLocalSheetRenderModel
} from "@domains/scriptProject/constants";
import { isSheetRenderModel } from "@domains/scriptProject/utils/isSheetRenderModel";
import { useTranslation } from "react-i18next";

type Props = {
  sheetRenderModel: AnySheetRenderModel;
  isDisabled: boolean;
  onChange: (nextRenderModel: AnySheetRenderModel) => void;
  isLocalProject?: boolean;
  /** A local project signed in to Mago Cloud also offers the cloud models. */
  includeCloudModels?: boolean;
  isLabelHidden?: boolean;
  testId?: string;
  localModels?: readonly LocalSheetRenderModel[];
  label?: string;
};

export const SheetRenderModelDropdown: React.FC<Props> = ({
  sheetRenderModel,
  isDisabled,
  onChange,
  isLocalProject = false,
  includeCloudModels = false,
  isLabelHidden = false,
  testId,
  localModels = LOCAL_SHEET_RENDER_MODELS,
  label
}) => {
  const { t } = useTranslation();
  const localModelItems = localModels.map((model) => ({
    key: model,
    label: t(`script_project.sheet_render_model_${model}.label`)
  }));
  const cloudModelItems = SHEET_RENDER_MODELS.map((model) => ({
    key: model,
    label: t(`script_project.sheet_render_model_${model}.label`)
  }));
  const modelItems: Array<{ key: string; label: string }> = isLocalProject
    ? [...localModelItems, ...(includeCloudModels ? cloudModelItems : [])]
    : cloudModelItems;

  return (
    <label className="flex flex-col gap-1">
      {!isLabelHidden && (
        <Text variant="xs" color="glyph-secondary">
          {label ?? t("script_project.sheet_render_model_input.label")}
        </Text>
      )}
      <Dropdown
        aria-label={label ?? t("script_project.sheet_render_model_input.label")}
        isDisabled={isDisabled}
        selectedKey={sheetRenderModel}
        items={modelItems}
        onSelectionChange={(key) => {
          const nextModel = String(key);
          if (
            isLocalProject &&
            !isLocalSheetRenderModel(nextModel) &&
            !(includeCloudModels && isSheetRenderModel(nextModel))
          )
            return;
          onChange(nextModel as AnySheetRenderModel);
        }}
        className="w-40"
        data-testid={testId}
      />
    </label>
  );
};
