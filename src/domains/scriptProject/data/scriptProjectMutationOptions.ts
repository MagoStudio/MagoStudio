/** What a root hook injects into a script-to-shots mutation so a failure reaches the user.
 *
 * The handler is injected rather than built here: the data layer owns the request and the cache,
 * and every toast in this codebase is raised by a root hook. */
export interface ScriptProjectMutationOptions<MutationRequest = unknown> {
  onError?: (error: unknown, request: MutationRequest) => void;
}
