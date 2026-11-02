import {
  LOCAL_MODEL_BUNDLES,
  STARTER_REQUIRED_BYTES,
  COMFY_STARTER_BUNDLE,
  requiredBundles
} from "../../../../desktop/shared/localModelManifest";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_GIGABYTE =
  BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;
const ONE_DECIMAL_PLACE = 10;

export const LOCAL_SETUP_REQUIRED_GIGABYTES =
  Math.round(
    (STARTER_REQUIRED_BYTES / BYTES_PER_GIGABYTE) * ONE_DECIMAL_PLACE
  ) / ONE_DECIMAL_PLACE;

export type LocalSetupDrive =
  import("../../../../desktop/shared/contracts").LocalSetupStorageDrive;

export type LocalSetupComponent = {
  id: string;
  name: string;
  gigabytes: number;
};

const toGigabytes = (bytes: number) =>
  Math.round((bytes / BYTES_PER_GIGABYTE) * ONE_DECIMAL_PLACE) /
  ONE_DECIMAL_PLACE;

export const localSetupComponents: LocalSetupComponent[] = requiredBundles(
  LOCAL_MODEL_BUNDLES
).map((bundle) => ({
  id: bundle.id,
  name: bundle.name,
  gigabytes: toGigabytes(
    bundle.files.reduce((total, file) => total + file.bytes, 0)
  )
}));

export const LOCAL_SETUP_FILE_COUNT =
  COMFY_STARTER_BUNDLE.partBytes.length +
  requiredBundles(LOCAL_MODEL_BUNDLES).reduce(
    (total, bundle) => total + bundle.files.length,
    0
  );

export const localSetupDamagedFilesStub = requiredBundles(LOCAL_MODEL_BUNDLES)
  .flatMap((bundle) => bundle.files)
  .slice(0, 2)
  .map((file) => file.targetPath.split("/").pop() ?? file.targetPath);

export const localSetupVerificationFindsDamagedFilesStub: boolean = false;
