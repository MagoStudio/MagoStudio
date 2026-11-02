import { AutoPromptItem } from "@domains/asset/interface";
import { AssetPromptResponse } from "@hooks/assets/interface";
import { AutoPromptVersionEnum } from "@hooks/types";

import { backendApiClient } from "@/lib/backend-api-client";

import { formatPromptFromResponse } from "../helpers/formatPromptFromResponse";

import {
  AutoPromptApiResponse,
  GenerateAutoPromptParams,
  AutoPromptRequestBody,
  AutoPromptVersion,
  UseAutoPromptParams
} from "./interface";

/** The desktop bridge runs the same AutoPrompt templates through Qwen3-VL in
 *  ComfyUI and returns the identical `{positive_prompt}` payload. */
const requestLocalAutoPrompt = async (
  requestBody: AutoPromptRequestBody
): Promise<AutoPromptApiResponse> => {
  const { imageUrls, motionDescription } = requestBody.apiRequestData;
  const urlFor = (type: "styleReferenceImage" | "sourceVideoFrame") =>
    imageUrls.find((image) => image.type === type)?.url;
  const styleReferenceImage = urlFor("styleReferenceImage");
  if (!styleReferenceImage) {
    throw new Error("styleReferenceImage is required");
  }
  return window.mago!.vlm.autoPrompt({
    version: requestBody.version,
    styleReferenceImage,
    sourceVideoFrame: urlFor("sourceVideoFrame"),
    motionDescription
  });
};

const sendAutoPromptRequest = async (
  requestBody: AutoPromptRequestBody
): Promise<AssetPromptResponse> => {
  try {
    const data =
      typeof window !== "undefined" && window.mago
        ? await requestLocalAutoPrompt(requestBody)
        : (
            await backendApiClient.post<AutoPromptApiResponse>(
              "/chat/auto-prompt",
              requestBody
            )
          ).data;

    if (!data.positive_prompt) {
      return {
        prompt: {
          positive: {
            content: "",
            setting: "",
            style: "",
            references: ""
          },
          negative: ""
        }
      };
    }

    return {
      prompt: {
        positive: {
          content: data.positive_prompt,
          setting: "",
          style: "",
          references: ""
        },
        negative: ""
      }
    };
  } catch (error: any) {
    console.error("Auto-prompt API error:", error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.status) {
      throw new Error(`Request failed with status ${error.response.status}`);
    }

    throw error;
  }
};

export const generateNewPrompt = async (
  params: UseAutoPromptParams
): Promise<AssetPromptResponse> => {
  const {
    styleReferenceImageBase64,
    sourceVideoFrameBase64,
    motionDescription,
    version,
    styleReferenceImageId,
    videoAssetId
  } = params;

  if (!styleReferenceImageBase64) {
    throw new Error("styleReferenceImage is required");
  }

  let result: AssetPromptResponse;

  if (version === AutoPromptVersionEnum.IMG2IMG_MAGO) {
    if (!sourceVideoFrameBase64) {
      throw new Error("sourceVideoFrame is required for img2img_mago");
    }
    result = await generateAutoPrompt({
      styleReferenceImageUrl: styleReferenceImageBase64,
      sourceVideoFrameUrl: sourceVideoFrameBase64,
      version
    });
  } else {
    if (!motionDescription?.trim()) {
      throw new Error("motionDescription is required for video2video_default");
    }
    result = await generateAutoPrompt({
      styleReferenceImageUrl: styleReferenceImageBase64,
      version,
      motionDescription
    });
  }

  if (!result || !styleReferenceImageId || !videoAssetId) {
    return result;
  }

  const formattedPrompt = formatPromptFromResponse(result);
  await saveAutoPromptToAsset(
    styleReferenceImageId,
    videoAssetId,
    version,
    formattedPrompt
  );

  return result;
};

const generateAutoPrompt = async (
  params: GenerateAutoPromptParams
): Promise<AssetPromptResponse> => {
  const {
    styleReferenceImageUrl,
    sourceVideoFrameUrl,
    motionDescription,
    version = AutoPromptVersionEnum.IMG2IMG_MAGO
  } = params;

  if (version === AutoPromptVersionEnum.VIDEO2VIDEO_DEFAULT) {
    if (!motionDescription?.trim()) {
      throw new Error("motionDescription is required for video2video_default");
    }

    const requestBody: AutoPromptRequestBody = {
      apiRequestData: {
        imageUrls: [
          {
            url: styleReferenceImageUrl,
            type: "styleReferenceImage"
          }
        ],
        motionDescription
      },
      version
    };

    return sendAutoPromptRequest(requestBody);
  }

  if (version === AutoPromptVersionEnum.IMG2IMG_MAGO) {
    if (!sourceVideoFrameUrl) {
      throw new Error("sourceVideoFrameUrl is required for img2img_mago");
    }

    const requestBody: AutoPromptRequestBody = {
      apiRequestData: {
        imageUrls: [
          {
            url: sourceVideoFrameUrl,
            type: "sourceVideoFrame"
          },
          {
            url: styleReferenceImageUrl,
            type: "styleReferenceImage"
          }
        ]
      },
      version
    };

    return sendAutoPromptRequest(requestBody);
  }

  throw new Error(`Unknown version: ${String(version)}`);
};

const saveAutoPromptToAsset = async (
  assetId: string,
  videoAssetId: string,
  version: AutoPromptVersion,
  positivePrompt: string
) => {
  if (typeof window !== "undefined" && window.mago) {
    return window.mago.vlm.saveAutoPrompt({
      assetId,
      videoAssetId,
      version,
      positivePrompt
    });
  }

  const response = await backendApiClient.post(
    `/assets/${assetId}/auto_prompt`,
    {
      video_asset_id: videoAssetId,
      version,
      positive_prompt: positivePrompt
    }
  );
  return response.data;
};

export const findExistingAutoPrompt = (
  autoPromptArray: AutoPromptItem[] | undefined,
  videoAssetId: string,
  version: AutoPromptVersion
): string | null => {
  if (!autoPromptArray || !Array.isArray(autoPromptArray)) return null;
  const existingPrompt = autoPromptArray.find(
    (item) => item.video_asset_id === videoAssetId && item.version === version
  );
  return existingPrompt?.positive_prompt || null;
};

export const createPromptResponse = (
  promptString: string
): AssetPromptResponse => {
  const parts = promptString.split("\n\n").filter(Boolean);
  return {
    prompt: {
      positive: {
        content: parts[0] || promptString,
        setting: parts[1] || "",
        style: parts[2] || "",
        references: parts[3] || ""
      },
      negative: ""
    }
  };
};
