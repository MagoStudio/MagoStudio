"use client";

import * as clerk from "@clerk/react";

import * as local from "./localIdentity";

/**
 * The app's single identity surface.
 *
 * Mago Studio has two identity backends: real Clerk when the user has signed in
 * to cloud Mago, and a local stand-in when they chose to work offline. Which one
 * is active is fixed for the lifetime of the window — the main process bakes the
 * mode into the window through additionalArguments, and changing it rebuilds the
 * window — so the implementation can be selected here at module load.
 *
 * That constancy is the point. Selecting per render would mean conditional hook
 * calls; selecting once means every call site below is an ordinary hook.
 *
 * Call sites import from here rather than from "@clerk/react" directly, so it is
 * greppable which components depend on identity, and so the offline build never
 * reaches Clerk's hooks at all.
 */

export type IdentityMode = "cloud" | "offline";

/**
 * Absent bridge means we are not in the desktop shell at all — unit tests,
 * Storybook, `next dev` in a browser — where the local identity is right.
 * "unchosen" is first launch, which now shows Clerk's own sign-in form as the
 * very first screen, so Clerk has to be the implementation before the user has
 * answered. Skipping that screen persists "offline" and rebuilds the window,
 * and from then on nothing reaches the network.
 */
export const readIdentityMode = (): IdentityMode => {
  if (typeof window === "undefined") return "offline";
  const mode = window.mago?.account?.mode;
  return mode === "cloud" || mode === "unchosen" ? "cloud" : "offline";
};

export const identityMode: IdentityMode = readIdentityMode();

/**
 * The mode as stored, which unlike `identityMode` distinguishes "not asked yet"
 * from "chose offline". Only the sign-in gate needs that difference.
 */
export const readAppMode = (): "cloud" | "offline" | "unchosen" => {
  if (typeof window === "undefined") return "offline";
  const mode = window.mago?.account?.mode;
  if (mode === "cloud" || mode === "offline") return mode;
  // No bridge at all means we are not in the desktop shell, where there is
  // nothing to ask and nothing to sign in to.
  return window.mago ? "unchosen" : "offline";
};

const implementation = identityMode === "cloud" ? clerk : local;

export const useUser = implementation.useUser as typeof clerk.useUser;
export const useAuth = implementation.useAuth as typeof clerk.useAuth;
export const useClerk = implementation.useClerk as typeof clerk.useClerk;
export const useSession = implementation.useSession as typeof clerk.useSession;

export const ClerkLoaded =
  implementation.ClerkLoaded as typeof clerk.ClerkLoaded;
export const ClerkLoading =
  implementation.ClerkLoading as typeof clerk.ClerkLoading;
export const Show = implementation.Show as typeof clerk.Show;
export const SignIn = implementation.SignIn as typeof clerk.SignIn;
export const SignUp = implementation.SignUp as typeof clerk.SignUp;
