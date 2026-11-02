import type { ReactNode } from "react";

import { OFFLINE_LOCAL_USER_ID } from "../../desktop/shared/localFolderDummyProject";

type Metadata = Record<string, unknown>;

interface LocalEmailAddress {
  emailAddress: string;
}

interface LocalSession {
  id: string;
}

interface LocalUser {
  [key: string]: unknown;
  id: string;
  imageUrl: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  createdAt: Date | null;
  primaryEmailAddress: LocalEmailAddress | null;
  emailAddresses: LocalEmailAddress[];
  publicMetadata: Metadata | undefined;
  unsafeMetadata: Metadata | undefined;
  getSessions: () => Promise<LocalSession[]>;
  updateMetadata: (input: { unsafeMetadata?: Metadata }) => Promise<void>;
  update: (input: object) => Promise<void>;
}

const localUser: LocalUser = {
  id: OFFLINE_LOCAL_USER_ID,
  imageUrl: "/logo.svg",
  firstName: "Local",
  lastName: "User",
  fullName: "Local User",
  createdAt: new Date(0),
  primaryEmailAddress: null,
  emailAddresses: [] as { emailAddress: string }[],
  publicMetadata: {} as Metadata,
  unsafeMetadata: {} as Metadata,
  getSessions: async () => [],
  updateMetadata: async ({ unsafeMetadata }: { unsafeMetadata?: Metadata }) => {
    if (unsafeMetadata) {
      Object.assign(localUser.unsafeMetadata ?? {}, unsafeMetadata);
    }
  },
  update: async (input: object) => {
    const fields = input as { firstName?: unknown; lastName?: unknown };
    if (typeof fields.firstName === "string") {
      localUser.firstName = fields.firstName;
    }
    if (typeof fields.lastName === "string")
      localUser.lastName = fields.lastName;
    localUser.fullName =
      `${localUser.firstName ?? ""} ${localUser.lastName ?? ""}`.trim();
  }
};

export const useUser = () => ({
  user: localUser,
  isLoaded: true,
  isSignedIn: true
});

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  getToken: async (_?: { template?: string }) => null
});

export const useClerk = () => ({
  openUserProfile: () => undefined,
  signOut: async (_?: { redirectUrl?: string }) => undefined
});

export const useSession = (): { session: LocalSession | null } => ({
  session: null
});

export const ClerkProvider = ({ children }: { children: ReactNode }) =>
  children;

export const ClerkLoading = ({ children }: { children: ReactNode }) => null;
export const ClerkLoaded = ({ children }: { children: ReactNode }) => children;

export const Show = ({
  when,
  children
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) => (when === "signed-in" ? children : null);

export const SignIn = (_: { signUpUrl?: string }) => null;
export const SignUp = (_: { signInUrl?: string }) => null;
