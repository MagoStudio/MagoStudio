/**
 * Tells the three reasons cloud Mago can be unreachable apart.
 *
 * They need different responses and look identical from the outside, which cost
 * us a debugging round trip: a build served a Content Security Policy that
 * allowed only production Clerk while the bundle loaded the dev instance, so
 * clerk-js was blocked and the app reported that it could not reach the cloud.
 * True, and useless.
 *
 * - `blocked`  the policy stopped the script loading. A build problem: no amount
 *              of retrying or reconnecting will help, and it needs saying so.
 * - `offline`  no network. Retrying later is exactly right.
 * - `unreachable` network is up but Mago did not answer. Retrying may help.
 */

export type CloudFailureKind = "blocked" | "offline" | "unreachable";

export interface CloudFailure {
  kind: CloudFailureKind;
  /** Shown to the user. */
  message: string;
  /** Extra line for a build problem, which a user cannot fix by waiting. */
  detail?: string;
}

export interface CloudFailureInputs {
  /** Hosts a Content Security Policy violation was observed for. */
  blockedHosts: readonly string[];
  /** The host clerk-js is expected to come from. */
  clerkHost: string | null;
  online: boolean;
}

export const describeCloudFailure = ({
  blockedHosts,
  clerkHost,
  online
}: CloudFailureInputs): CloudFailure => {
  const blockedClerk =
    clerkHost !== null && blockedHosts.some((host) => host.includes(clerkHost));

  if (blockedClerk) {
    return {
      kind: "blocked",
      message: "Mago cannot sign in because a security policy blocked it.",
      // Names the host so the mismatch is obvious in a bug report.
      detail: `The app was built for a different Mago environment than it is configured to allow (${clerkHost}). Reinstalling or a corrected build will fix it; waiting will not.`
    };
  }

  if (!online) {
    return {
      kind: "offline",
      message: "Mago cannot reach the cloud because this computer is offline."
    };
  }

  return {
    kind: "unreachable",
    message: "Mago cannot reach the cloud right now."
  };
};
