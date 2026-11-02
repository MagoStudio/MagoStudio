import { doesModelSupportVideoReferenceToggle } from "./doesModelSupportVideoReferenceToggle";

export const buildLocalVideoRenderSettings = ({
  model,
  wireSettings,
  panelSettings
}: {
  model: string;
  wireSettings: Record<string, unknown>;
  panelSettings: Record<string, unknown>;
}): Record<string, unknown> => {
  if (!doesModelSupportVideoReferenceToggle(model)) return wireSettings;
  return {
    ...wireSettings,
    use_video_reference: panelSettings.use_video_reference !== false
  };
};
