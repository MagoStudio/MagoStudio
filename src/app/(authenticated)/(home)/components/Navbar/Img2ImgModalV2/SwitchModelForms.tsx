import React from "react";
import { useWatch } from "react-hook-form";

import { GptImage2Form } from "./forms/GptImage2Form";
import { Nanobanana2Form } from "./forms/Nanobanana2Form";
import { NanobananaProForm } from "./forms/NanobananaProForm";
import { QwenForm } from "./forms/QwenForm";
import { Seedream5ProForm } from "./forms/Seedream5ProForm";
import { Img2ImgType } from "./schemas";

export const SwitchModelForms: React.FC = () => {
  const model = useWatch<Img2ImgType>({ name: "model" });

  switch (model) {
    case "seedream_5_pro":
      return <Seedream5ProForm />;
    case "nanobanana_2":
      return <Nanobanana2Form />;
    case "nanobanana_pro":
      return <NanobananaProForm />;
    case "qwen":
      return <QwenForm />;
    case "gpt_image_2":
      return <GptImage2Form />;
    default:
      return <div />;
  }
};
