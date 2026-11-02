/**
 * Verbatim copy of the backend's image description prompt, used to fill a
 * plain image
 * asset's `description` (a generated image or an upload — not a reference
 * sheet, which uses `entityDescriptionPrompt` instead).
 *
 * Copied rather than fetched because the local build has no backend. If the
 * cloud template changes, this file has to be updated deliberately.
 */

export const IMAGE_DESCRIPTION_PROMPT =
  "Describe this image in two or three sentences: the subject, its setting, and its " +
  "durably visible attributes (identity, wardrobe or material, colour, distinctive " +
  "features). Do not interpret mood, do not guess at story. Write plain prose, no " +
  "lists, no preamble, and do not begin with 'the image' or 'this picture'.";
