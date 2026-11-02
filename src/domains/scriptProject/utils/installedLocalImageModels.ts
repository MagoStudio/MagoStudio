import { LOCAL_SHEET_RENDER_MODELS } from "../constants";

const SETUP_IDS = [
  "qwen-image-sheet",
  "flux-klein-4b-sheet",
  "flux-klein-9b-sheet"
];
export const installedLocalImageModels = (
  setup:
    | { optional: { id: string; requirements: { status: string }[] }[] }
    | undefined
) =>
  LOCAL_SHEET_RENDER_MODELS.filter((_model, index) => {
    const group = setup?.optional.find((item) => item.id === SETUP_IDS[index]);
    return (
      !!group &&
      group.requirements.length > 0 &&
      group.requirements.every((item) => item.status === "installed")
    );
  });
