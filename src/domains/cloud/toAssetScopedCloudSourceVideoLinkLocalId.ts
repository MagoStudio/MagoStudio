import { toSourceVideoTrimKey } from "../../../desktop/shared/toSourceVideoTrimKey";

const untrimmedSourceVideoTrimKey = toSourceVideoTrimKey({});

export const toAssetScopedCloudSourceVideoLinkLocalId = ({
  localAssetId,
  sourceVideoTrimKey
}: {
  localAssetId: string;
  sourceVideoTrimKey: string;
}): string =>
  sourceVideoTrimKey === untrimmedSourceVideoTrimKey
    ? localAssetId
    : `${localAssetId}#trim-${sourceVideoTrimKey}`;
