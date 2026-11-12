import type {
  ModelFileChoice,
  RecommendedModelFile
} from "../../../../../../../desktop/shared/modelSettings";

export const listLocalModelFilesExceptRecommended = (
  choices: readonly ModelFileChoice[],
  recommendedFile: RecommendedModelFile
): ModelFileChoice[] => {
  const recommendedFilenameLowercase = recommendedFile.filename.toLowerCase();
  return choices.filter(
    (choice) => choice.filename.toLowerCase() !== recommendedFilenameLowercase
  );
};
