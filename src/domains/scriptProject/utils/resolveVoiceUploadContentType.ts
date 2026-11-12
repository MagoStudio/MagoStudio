const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  flac: "audio/flac",
  ogg: "audio/ogg",
  oga: "audio/ogg"
};
const CONTENT_TYPE_ALIASES: Record<string, string> = {
  "audio/mp3": "audio/mpeg",
  "audio/wave": "audio/wav",
  "audio/x-flac": "audio/flac",
  "audio/x-m4a": "audio/mp4"
};
const ACCEPTED_CONTENT_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/flac",
  "audio/ogg"
]);

export const resolveVoiceUploadContentType = (file: {
  name: string;
  type: string;
}): string | undefined => {
  const contentType = file.type.toLowerCase();
  if (ACCEPTED_CONTENT_TYPES.has(contentType)) return contentType;
  if (CONTENT_TYPE_ALIASES[contentType])
    return CONTENT_TYPE_ALIASES[contentType];
  if (contentType && contentType !== "application/octet-stream")
    return undefined;
  return CONTENT_TYPE_BY_EXTENSION[
    file.name.split(".").pop()?.toLowerCase() ?? ""
  ];
};
