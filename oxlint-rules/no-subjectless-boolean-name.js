/**
 * oxlint rule: no-subjectless-boolean-name
 *
 * A boolean must carry its subject. `isReady` is not a name — ready for what?
 * `isPreviewAssetFinished` is.
 *
 * Only the mechanical half of that rule is enforceable: a closed denylist of
 * names that are a bare adjective or permission with no noun attached. The
 * judgement half — parallel predicates sharing a verb, and binding a value to a
 * name that means something else — needs to know what identifiers *mean* and
 * stays a review-time concern.
 *
 * The denylist is deliberately narrow, and the exclusions matter more than the
 * entries. A boolean on a component or on a result object takes THAT OBJECT as
 * its implicit subject, which is a legitimate reading: `NavbarLink`'s
 * `isActive`, `Tooltip`'s `isVisible`, and a validation result's `isValid` all
 * name their subject by context. Measured against `src/` while this rule was
 * written, a broader denylist produced 25 hits of which roughly 17 were that
 * pattern — a two-thirds false-positive rate, which is how a lint rule teaches
 * people to ignore it.
 *
 * So excluded on purpose: `isActive`, `isVisible`, `isEnabled`, `isValid`,
 * `shouldShow` (implicit subject); `isDisabled`, `isSelected`, `isOpen`,
 * `isInvalid`, `isRequired`, `isReadOnly` (React Aria Components); and
 * `isLoading`, `isPending`, `isFetching`, `isError`, `isSuccess` (TanStack
 * Query).
 *
 * What is left are names with no implicit subject available — ready for what,
 * use what, access to what — where the reader has nothing to fall back on.
 *
 * SCOPE, stated precisely because the surrounding docs must not overclaim: this
 * visits variable bindings (including names bound by object and array
 * destructuring, and by parameter defaults and rest elements), TypeScript
 * property signatures, function parameters, and object-literal keys. It does NOT
 * visit class fields, which a functional React codebase barely has.
 *
 * Object literals are judged on the KEY, because that is the field being
 * declared: `{ isReady: somethingWellNamed }` still puts a subject-less field on
 * the object for a later reader to destructure. Destructuring patterns are the
 * mirror image, judged on the local BINDING, so
 * `const { isReady: isPreviewAssetFinished } = …` passes — renaming at the
 * destructure is the fix, not the offence.
 */

/**
 * Bare adjectives and permissions with no implicit subject. Matched exactly, so
 * a name that already carries its noun (`isBulkRenderingAvailableForUser`,
 * `isRenderPayloadValid`) never matches.
 */
const SUBJECTLESS_BOOLEAN_NAMES = new Set([
  "canAccess",
  "canUse",
  "hasAccess",
  "hasPermission",
  "isAllowed",
  "isAvailable",
  "isBlocked",
  "isEligible",
  "isExcluded",
  "isReady",
  "isSupported"
]);

/** Whether `name` is a boolean name carrying no subject. Pure, so it is unit-testable without a lint run. */
const isSubjectlessBooleanName = (name) =>
  typeof name === "string" && SUBJECTLESS_BOOLEAN_NAMES.has(name);

/** @type {import("oxlint/plugins-dev").Rule} */
const rule = {
  meta: {
    schema: []
  },
  create(context) {
    const reportIfSubjectless = (node) => {
      if (node?.type !== "Identifier") return;
      if (!isSubjectlessBooleanName(node.name)) return;

      context.report({
        node,
        message: `"${node.name}" names no subject — ${node.name} what? Put the noun in the name (e.g. "isPreviewAssetFinished", not "isReady").`
      });
    };

    const reportBindings = (target) => {
      if (!target) return;
      if (target.type === "Identifier") {
        reportIfSubjectless(target);
        return;
      }
      if (target.type === "ObjectPattern") {
        for (const property of target.properties) {
          reportBindings(property.value ?? property.argument);
        }
        return;
      }
      if (target.type === "ArrayPattern") {
        for (const element of target.elements) {
          reportBindings(element);
        }
        return;
      }
      if (target.type === "AssignmentPattern") {
        reportBindings(target.left);
        return;
      }
      if (target.type === "RestElement") {
        reportBindings(target.argument);
      }
    };

    const reportParameters = (node) => {
      for (const parameter of node.params ?? []) {
        reportBindings(parameter);
      }
    };

    return {
      VariableDeclarator: (node) => reportBindings(node.id),
      TSPropertySignature: (node) => reportIfSubjectless(node.key),
      FunctionDeclaration: reportParameters,
      FunctionExpression: reportParameters,
      ArrowFunctionExpression: reportParameters,
      ObjectExpression: (node) => {
        for (const property of node.properties ?? []) {
          if (property.type !== "Property" || property.computed) continue;
          reportIfSubjectless(property.key);
        }
      }
    };
  }
};

export default rule;
export { isSubjectlessBooleanName, rule, SUBJECTLESS_BOOLEAN_NAMES };
