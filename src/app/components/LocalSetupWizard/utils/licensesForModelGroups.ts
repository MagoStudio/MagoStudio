import {
  allBundleIdsOfModelGroup,
  findLocalModelGroup,
  type LocalModelGroupId
} from "../../../../../desktop/shared/localModelGroups";
import {
  LOCAL_MODEL_LICENSES,
  type LocalModelLicense
} from "../../../../../desktop/shared/localModelLicenses";
import {
  huggingFaceRepoOfUrl,
  LOCAL_MODEL_BUNDLES
} from "../../../../../desktop/shared/localModelManifest";

export const licensesForModelGroups = (
  modelGroupIds: LocalModelGroupId[]
): LocalModelLicense[] => {
  const bundleIds = new Set(
    modelGroupIds.flatMap((groupId) =>
      allBundleIdsOfModelGroup(findLocalModelGroup(groupId))
    )
  );
  const huggingFaceRepos = new Set(
    LOCAL_MODEL_BUNDLES.filter((bundle) => bundleIds.has(bundle.id))
      .flatMap((bundle) => bundle.files)
      .map((file) => huggingFaceRepoOfUrl(file.url))
  );
  return LOCAL_MODEL_LICENSES.filter((license) =>
    huggingFaceRepos.has(license.huggingFaceRepo)
  );
};
