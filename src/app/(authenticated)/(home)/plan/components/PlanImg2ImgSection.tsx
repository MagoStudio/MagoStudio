/* oxlint-disable custom-react/no-use-effect -- legitimate sync of form state up to the parent */
import { Text } from "@components/Text";
import { ModelSelector } from "@home/components/Navbar/Img2ImgModalV2/ModelSelector";
import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { SwitchModelForms } from "@home/components/Navbar/Img2ImgModalV2/SwitchModelForms";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface PlanImg2ImgSectionHandle {
  getValues: () => Img2ImgType;
  trigger: () => Promise<boolean>;
}

interface PlanImg2ImgSectionProps {
  onValuesChange?: (values: Img2ImgType) => void;
  initialValues?: Img2ImgType;
}

const PLAN_IMG2IMG_DEFAULTS = Img2ImgSchema.parse({
  model: "nanobanana_pro",
  frameType: "video"
});

export const PlanImg2ImgSection = forwardRef<
  PlanImg2ImgSectionHandle,
  PlanImg2ImgSectionProps
>(function PlanImg2ImgSection({ onValuesChange, initialValues }, ref) {
  const { t } = useTranslation();

  const methods = useForm<Img2ImgType>({
    resolver: zodResolver(Img2ImgSchema) as any,
    defaultValues:
      (initialValues as Img2ImgType) ?? (PLAN_IMG2IMG_DEFAULTS as Img2ImgType)
  });

  useImperativeHandle(ref, () => ({
    getValues: methods.getValues,
    trigger: methods.trigger
  }));

  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    onValuesChange?.(watchedValues as Img2ImgType);
  }, [watchedValues, onValuesChange]);

  return (
    <div className="flex flex-col gap-4">
      <Text variant="md" weight="semibold" color="glyph-primary">
        {t("plan.img2img_settings.label")}
      </Text>
      <FormProvider {...methods}>
        <div className="flex flex-col gap-4">
          <ModelSelector />
          <SwitchModelForms />
        </div>
      </FormProvider>
    </div>
  );
});
