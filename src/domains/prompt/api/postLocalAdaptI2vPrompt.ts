import { getLocalDesktopApi } from "@/platform/localDesktop";

import { AdaptedI2vPrompt, AdaptI2vPromptRequestBody } from "../interface";

/** The desktop bridge's `/adapt_i2v_prompt`: same body and response, with local
 *  asset ids and the local script text model. */
export const postLocalAdaptI2vPrompt = (
  requestBody: AdaptI2vPromptRequestBody
): Promise<AdaptedI2vPrompt> =>
  getLocalDesktopApi().vlm.adaptI2vPrompt(requestBody);
