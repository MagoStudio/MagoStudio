import { AppliedMaskTile } from "@home/components/renderSettingsComponents/AppliedMaskTile";
import { CheckboxInput } from "@home/components/renderSettingsComponents/CheckboxInput";
import { CheckboxOrNumberInput } from "@home/components/renderSettingsComponents/CheckboxOrNumberInput";
import { ControlNetTypeSelector } from "@home/components/renderSettingsComponents/ControlNetTypeSelector";
import { EditFirstFrameInput } from "@home/components/renderSettingsComponents/EditFirstFrameInput/EditFirstFrameInput";
import { FileUploaderWithStylizeButton } from "@home/components/renderSettingsComponents/FileUploaderWithStylizeButton";
import { FrameAndMaskInput } from "@home/components/renderSettingsComponents/FrameAndMaskInput/FrameAndMaskInput";
import { MaskInput } from "@home/components/renderSettingsComponents/MaskInput/MaskInput";
import { MaskModeSelector } from "@home/components/renderSettingsComponents/MaskModeSelector";
import { MaskPromptInput } from "@home/components/renderSettingsComponents/MaskPromptInput";
import { MaskTrackSelector } from "@home/components/renderSettingsComponents/MaskTrackSelector";
import { ModifyFrameInput } from "@home/components/renderSettingsComponents/ModifyFrameInput";
import { MultiImageTileUploader } from "@home/components/renderSettingsComponents/MultiImageTileUploader";
import { MultiImageUploader } from "@home/components/renderSettingsComponents/MultiImageUploader";
import { NumberInput } from "@home/components/renderSettingsComponents/NumberInput";
import { NumberInputFullWidth } from "@home/components/renderSettingsComponents/NumberInputFullWidth";
import { NumberInputWithLabelInside } from "@home/components/renderSettingsComponents/NumberInputWithLabelInside";
import { Prompt } from "@home/components/renderSettingsComponents/Prompt";
import { PromptWithAdaptI2vButton } from "@home/components/renderSettingsComponents/PromptWithAdaptI2vButton";
import { PromptWithEnhancePromptButton } from "@home/components/renderSettingsComponents/PromptWithEnhancePromptButton";
import { RangeToStartEndInput } from "@home/components/renderSettingsComponents/RangeToStartEndInput";
import { SelectInput } from "@home/components/renderSettingsComponents/SelectInput";
import { SetupInfo } from "@home/components/renderSettingsComponents/SetupInfo";
import { SingleImageUploader } from "@home/components/renderSettingsComponents/SingleImageUploader";
import { SliderAndNumberInput } from "@home/components/renderSettingsComponents/SliderAndNumberInput";
import { SliderAndNumberInputFullWidth } from "@home/components/renderSettingsComponents/SliderAndNumberInputFullWidth";
import { SwitchInput } from "@home/components/renderSettingsComponents/SwitchInput";
import { TextInput } from "@home/components/renderSettingsComponents/TextInput";
import { TwoAngleImageUploader } from "@home/components/renderSettingsComponents/TwoAngleImageUploader";
import { VisualMaskSelection } from "@home/components/renderSettingsComponents/VisualMaskSelection";

export const availableUiComponents = {
  FileUploaderWithStylizeButton: FileUploaderWithStylizeButton,
  EditFirstFrameInput: EditFirstFrameInput,
  FrameAndMaskInput: FrameAndMaskInput,
  ModifyFrameInput: ModifyFrameInput,
  AppliedMaskTile: AppliedMaskTile,
  MaskPromptInput: MaskPromptInput,
  MultiImageUploader: MultiImageUploader,
  MultiImageTileUploader: MultiImageTileUploader,
  SingleImageUploader: SingleImageUploader,
  TwoAngleImageUploader: TwoAngleImageUploader,
  Prompt: Prompt,
  PromptWithAdaptI2vButton: PromptWithAdaptI2vButton,
  PromptWithEnhancePromptButton: PromptWithEnhancePromptButton,
  NumberInput: NumberInput,
  NumberInputFullWidth: NumberInputFullWidth,
  NumberInputWithLabelInside: NumberInputWithLabelInside,
  SliderAndNumberInput: SliderAndNumberInput,
  SliderAndNumberInputFullWidth: SliderAndNumberInputFullWidth,
  CheckboxInput: CheckboxInput,
  SwitchInput: SwitchInput,
  CheckboxOrNumberInput: CheckboxOrNumberInput,
  RangeToStartEndInput: RangeToStartEndInput,
  SelectInput: SelectInput,
  SetupInfo: SetupInfo,
  MaskInput: MaskInput,
  MaskModeSelector: MaskModeSelector,
  MaskTrackSelector: MaskTrackSelector,
  TextInput: TextInput,
  ControlNetTypeSelector: ControlNetTypeSelector,
  VisualMaskSelection: VisualMaskSelection,
  hidden: () => null
};

export type AvailableUiComponentKey = keyof typeof availableUiComponents;
