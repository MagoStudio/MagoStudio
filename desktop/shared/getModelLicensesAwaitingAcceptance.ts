import {
  LOCAL_MODEL_LICENSES,
  type LocalModelLicense
} from "./localModelLicenses";

export const getModelLicensesAwaitingAcceptance = (
  acceptedHuggingFaceRepos: string[],
  modelLicenses: LocalModelLicense[] = LOCAL_MODEL_LICENSES
): LocalModelLicense[] => {
  const accepted = new Set(acceptedHuggingFaceRepos);
  return modelLicenses.filter(
    (license) =>
      !license.isPermissiveLicense && !accepted.has(license.huggingFaceRepo)
  );
};
