import path from "node:path";

/**
 * oxlint rule: no-cross-domain-internal-imports
 *
 * A domain's `data/` and `api/` folders are private. Only files inside the same
 * domain (`src/domains/<domain>/**`) may import `<domain>/data/*` or
 * `<domain>/api/*`. Everyone else — components, stores, app hooks, and other
 * domains — must consume a domain through its public surface: root hooks, root
 * re-exports, or `utils/`.
 *
 * All import forms are covered: both path-alias spellings that resolve into
 * `src/domains` (`@domains/<domain>/…` and `@/domains/<domain>/…`) AND relative
 * paths (`../asset/data/…`), which are resolved against the importing file
 * before the check. Static imports, re-exports (`export … from`), and dynamic
 * `import()` of a string literal are all visited.
 *
 * Path matching is agnostic to whether the linter hands us an absolute
 * (`/repo/src/domains/…`) or a repo-relative (`src/domains/…`) filename — oxlint
 * differs across versions/platforms — so `src/domains/` is matched with or
 * without a leading slash, and relative imports are joined (not resolved to an
 * absolute CWD-dependent path) to preserve the filename's rootedness.
 */

/** Target domain + private layer from either alias spelling, e.g. `@domains/track/data/useX` or `@/domains/track/data/useX`. */
const ALIAS_PRIVATE_LAYER = /^@\/?domains\/([^/]+)\/(data|api)(?:\/|$)/;
/** Target domain + private layer from a joined path (absolute or repo-relative). */
const RESOLVED_PRIVATE_LAYER =
  /(?:^|\/)src\/domains\/([^/]+)\/(data|api)(?:\/|$)/;
/** The importing file's owning domain (absolute or repo-relative filename). */
const OWNING_DOMAIN_OF_FILE = /(?:^|\/)src\/domains\/([^/]+)\//;

const toPosix = (filePath) => filePath.replaceAll("\\", "/");

/**
 * The private-layer target a `source` specifier points at, given the importing
 * `filename`. Returns `{ domain, layer }` for an `@domains/X/(data|api)` alias,
 * a `@/domains/X/(data|api)` alias, or a relative import that lands in a
 * `src/domains/X/(data|api)` folder; otherwise `null`. Pure and path-format
 * agnostic (accepts absolute or repo-relative `filename`) so it is unit-testable
 * without a full lint run — this is the logic that historically diverged between
 * local (absolute filenames) and CI (relative filenames).
 */
const privateLayerTarget = (filename, source) => {
  const aliasMatch = source.match(ALIAS_PRIVATE_LAYER);
  if (aliasMatch) {
    return { domain: aliasMatch[1], layer: aliasMatch[2] };
  }
  if (source.startsWith(".")) {
    const joined = path.posix.join(path.posix.dirname(filename), source);
    const resolvedMatch = joined.match(RESOLVED_PRIVATE_LAYER);
    if (resolvedMatch) {
      return { domain: resolvedMatch[1], layer: resolvedMatch[2] };
    }
  }
  return null;
};

/**
 * The cross-domain violation for importing `source` from `filename`, or `null`
 * when the import is allowed (not a private layer, or intra-domain).
 */
const crossDomainImport = (filename, source) => {
  const target = privateLayerTarget(filename, source);
  if (!target) return null;

  const importerDomain = filename.match(OWNING_DOMAIN_OF_FILE)?.[1] ?? null;
  if (target.domain === importerDomain) return null;

  return target;
};

/** @type {import("oxlint/plugins-dev").Rule} */
const rule = {
  meta: {
    schema: []
  },
  create(context) {
    const filename = toPosix(
      context.physicalFilename || context.filename || ""
    );

    const reportIfCrossDomain = (node) => {
      const source = node.source?.value;
      if (typeof source !== "string") return;

      const violation = crossDomainImport(filename, source);
      if (!violation) return;

      const { domain, layer } = violation;
      context.report({
        node: node.source,
        message: `"${domain}/${layer}" is private to the "${domain}" domain. Import through its root hooks, root re-exports, or utils/ — not its ${layer}/ internals.`
      });
    };

    return {
      ImportDeclaration: reportIfCrossDomain,
      ImportExpression: reportIfCrossDomain,
      ExportNamedDeclaration: reportIfCrossDomain,
      ExportAllDeclaration: reportIfCrossDomain
    };
  }
};

export default rule;
export { rule, crossDomainImport };
