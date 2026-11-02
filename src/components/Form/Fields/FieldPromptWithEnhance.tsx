import { VideoDescriptionAutoPrompt } from "@home/components/Navbar/Img2ImgModalV2/VideoDescriptionAutoPrompt";
import { PromptWithEnhancePromptButton } from "@home/components/renderSettingsComponents/PromptWithEnhancePromptButton";
import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

type FieldPromptWithEnhanceProps = {
  name: string;
  label?: string;
  tooltip?: string;
};

export function FieldPromptWithEnhance(props: FieldPromptWithEnhanceProps) {
  const { name, ...rest } = props;
  const { setValue } = useFormContext();
  const value = useWatch({ name });

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      setValue(name, newValue, { shouldValidate: true });
    },
    [name, setValue]
  );

  return (
    <>
      {name === "prompt" && (
        <VideoDescriptionAutoPrompt onUsePrompt={handleChange} />
      )}
      <PromptWithEnhancePromptButton
        key={name}
        name={name}
        label={""}
        ariaLabel={props.label || ""}
        labelCaption={""}
        tooltip={""}
        defaultValue={undefined}
        {...rest}
        setValue={handleChange}
        value={value}
      />
    </>
  );
}
