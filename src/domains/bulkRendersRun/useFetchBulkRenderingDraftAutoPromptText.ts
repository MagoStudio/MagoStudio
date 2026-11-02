import { getAssetPrompt } from "@domains/asset/getAssetPrompt";
import { selectPromptWithFormattedText } from "@domains/asset/utils/selectPromptWithFormattedText";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

export const useFetchBulkRenderingDraftAutoPromptText = () => {
  const queryClient = useQueryClient();

  const fetchAutoPromptText = async (
    videoAssetId: string
  ): Promise<string | undefined> => {
    const promptResponse = await queryClient.fetchQuery({
      queryKey: queryKeys.assetPrompt.byId(videoAssetId),
      queryFn: () => getAssetPrompt(videoAssetId),
      staleTime: Infinity
    });

    return selectPromptWithFormattedText(promptResponse)?.formattedText;
  };

  return { fetchAutoPromptText };
};
