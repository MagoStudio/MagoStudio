import { useUser } from "@platform/identity";

export const USER_TEST_ID = "user_00000000000000000000000000";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
export const baseUser: Partial<ClerkUser> = {
  id: USER_TEST_ID,
  externalId: null,
  primaryEmailAddressId: null,
  primaryEmailAddress: null,
  primaryPhoneNumberId: null,
  primaryPhoneNumber: null,
  primaryWeb3WalletId: null,
  primaryWeb3Wallet: null,
  username: null,
  fullName: null,
  firstName: null,
  lastName: null,
  imageUrl: "",
  hasImage: false,
  emailAddresses: [
    { emailAddress: "user@example.com" } as ClerkUser["emailAddresses"][0]
  ],
  phoneNumbers: [],
  web3Wallets: [],
  externalAccounts: [],
  enterpriseAccounts: [],
  passkeys: [],

  organizationMemberships: [],
  passwordEnabled: false,
  totpEnabled: false,
  backupCodeEnabled: false,
  twoFactorEnabled: false,
  publicMetadata: undefined,
  unsafeMetadata: undefined,
  lastSignInAt: null,
  legalAcceptedAt: null,
  createOrganizationEnabled: false,
  createOrganizationsLimit: null,
  deleteSelfEnabled: false,
  updatedAt: null,
  createdAt: null
};
