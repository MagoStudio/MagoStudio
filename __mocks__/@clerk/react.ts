import React from "react";

const MOCK_USER = {
  id: "user_storybook",
  firstName: "Storybook",
  lastName: "User",
  fullName: "Storybook User",
  username: "storybook-user",
  primaryEmailAddress: { emailAddress: "storybook@example.com" },
  emailAddresses: [{ emailAddress: "storybook@example.com" }],
  imageUrl: "",
  publicMetadata: {},
  unsafeMetadata: {}
};

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: MOCK_USER
});

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: "user_storybook",
  getToken: async () => "mock-token",
  orgId: null,
  orgRole: null,
  orgSlug: null,
  sessionId: "sess_storybook",
  has: () => false,
  signOut: async () => {}
});

export const useClerk = () => ({
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {}
});

export const useSession = () => ({
  isLoaded: true,
  isSignedIn: true,
  session: { id: "sess_storybook" }
});

export const ClerkProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const ClerkLoading = ({ children }: { children: React.ReactNode }) =>
  null;

export const ClerkLoaded = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const SignIn = () => React.createElement("div", null, "Sign In Mock");
export const SignUp = () => React.createElement("div", null, "Sign Up Mock");

export const Show = ({
  when,
  children,
  fallback
}: {
  when: string | boolean | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) =>
  React.createElement(
    React.Fragment,
    null,
    when === "signed-in" || when === true ? children : fallback
  );
