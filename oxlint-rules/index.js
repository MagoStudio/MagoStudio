import noArbitraryZIndex from "./no-arbitrary-z-index.js";
import noCrossDomainInternalImports from "./no-cross-domain-internal-imports.js";
import noSubjectlessBooleanName from "./no-subjectless-boolean-name.js";

/** @type {import("oxlint/plugins-dev").Plugin} */
export default {
  meta: {
    name: "local"
  },
  rules: {
    "no-arbitrary-z-index": noArbitraryZIndex,
    "no-cross-domain-internal-imports": noCrossDomainInternalImports,
    "no-subjectless-boolean-name": noSubjectlessBooleanName
  }
};
