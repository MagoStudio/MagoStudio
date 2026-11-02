import type { useUser } from "@platform/identity";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

export interface UnsafeMetadataTopLevelFields {
  firstName?: string;
  lastName?: string;
}

export const enrichUnsafeMetadata = async (
  user: ClerkUser,
  patch: Record<string, unknown>,
  topLevelFields?: UnsafeMetadataTopLevelFields
): Promise<void> => {
  const writes: Promise<unknown>[] = [
    user.updateMetadata({ unsafeMetadata: patch })
  ];

  if (topLevelFields && Object.keys(topLevelFields).length > 0) {
    writes.push(user.update(topLevelFields));
  }

  await Promise.all(writes);
};
