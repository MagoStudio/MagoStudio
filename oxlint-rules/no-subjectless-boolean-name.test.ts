import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import {
  isSubjectlessBooleanName,
  rule,
  SUBJECTLESS_BOOLEAN_NAMES
} from "./no-subjectless-boolean-name.js";

// Wire oxlint's RuleTester to vitest so its cases run as vitest tests.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

ruleTester.run("no-subjectless-boolean-name", rule, {
  valid: [
    {
      // Carries its subject — the whole point of the rule.
      filename:
        "/repo/src/domains/bulkRendersRun/useIsBulkRenderingEntryVisible.ts",
      code: `const isBulkRenderingAvailableForUser = useIsBulkRenderingAvailableForUser();`
    },
    {
      // A longer name that merely starts with a denylisted entry must not match.
      filename: "/repo/src/domains/renders/utils/isRenderPayloadReady.ts",
      code: `const isReadyForSubmission = check();`
    },
    {
      // Implicit subject: the component is what is active.
      filename:
        "/repo/src/app/(authenticated)/(home)/components/Navbar/NavbarLink.tsx",
      code: `const isActive = pathname === href;`
    },
    {
      // Implicit subject: the result object is what is valid.
      filename: "/repo/src/domains/renders/utils/validateRenderPayload.ts",
      code: `interface RenderPayloadValidationResult { isValid: boolean }`
    },
    {
      // React Aria Components contract name.
      filename: "/repo/src/components/Button/index.tsx",
      code: `const isDisabled = props.isDisabled ?? false;`
    },
    {
      // TanStack Query contract name.
      filename: "/repo/src/domains/asset/data/useGetAsset.ts",
      code: `const isLoading = query.isLoading;`
    },
    {
      // Renaming at the destructure is the FIX, not the offence — judged on the binding.
      filename: "/repo/src/app/components/ClipPreview/index.tsx",
      code: `const { isReady: isPreviewAssetFinished } = useTrackPreviewUpdate({});`
    },
    {
      // A parameter that carries its subject.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `function submit(isRenderPayloadReady) { return isRenderPayloadReady; }`
    },
    {
      // An object-literal key that carries its subject.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `const result = { isRenderPayloadReady: true };`
    },
    {
      // A computed key is not a declared field name.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `const result = { [isReady]: true };`
    },
    {
      // Out of scope by design: class fields are not visited.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `class Thing { isReady = false; }`
    }
  ],
  invalid: [
    {
      // Ready for what? Nothing in scope supplies the noun.
      filename: "/repo/src/app/hooks/preview/useTrackPreviewUpdate.tsx",
      code: `const isReady = status === AssetStatus.FINISHED;`,
      errors: 1
    },
    {
      // Interface field, where the destructuring damage starts.
      filename: "/repo/src/app/hooks/preview/useTrackPreviewUpdate.tsx",
      code: `interface UseTrackPreviewUpdateResult { isReady: boolean }`,
      errors: 1
    },
    {
      // A permission naming neither the subject nor what is permitted.
      filename: "/repo/src/domains/bulkRendersRun/useCanUseBulkRendering.ts",
      code: `const canUse = useIsTeamMember();`,
      errors: 1
    },
    {
      // Available to whom, for what?
      filename: "/repo/src/app/models/video/types.ts",
      code: `interface VideoModelCapabilities { isAvailable: boolean }`,
      errors: 1
    },
    {
      // Shorthand destructuring — where the subject is lost in practice.
      filename: "/repo/src/app/components/ClipPreview/index.tsx",
      code: `const { isReady } = useTrackPreviewUpdate({});`,
      errors: 1
    },
    {
      // Nested destructuring still binds a subject-less name.
      filename: "/repo/src/domains/payment/useBalance.tsx",
      code: `const { state: { canUse } } = useThing();`,
      errors: 1
    },
    {
      // Array destructuring binds one too.
      filename: "/repo/src/domains/renders/useRenderState.ts",
      code: `const [isAvailable, setAvailable] = useState(false);`,
      errors: 1
    },
    {
      // A function parameter has no subject either.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `function submit(isReady) { return isReady; }`,
      errors: 1
    },
    {
      // A parameter default still binds the name.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `const submit = (isAvailable = false) => isAvailable;`,
      errors: 1
    },
    {
      // An object-literal key declares a subject-less field, however well named its value.
      filename: "/repo/src/domains/renders/utils/render.ts",
      code: `const result = { isReady: isRenderPayloadFinished };`,
      errors: 1
    }
  ]
});

describe("isSubjectlessBooleanName", () => {
  it("matches a bare adjective exactly", () => {
    expect(isSubjectlessBooleanName("isReady")).toBe(true);
    expect(isSubjectlessBooleanName("isAvailable")).toBe(true);
    expect(isSubjectlessBooleanName("canUse")).toBe(true);
  });

  it("does not match a name that carries its subject", () => {
    expect(isSubjectlessBooleanName("isBulkRenderingAvailableForUser")).toBe(
      false
    );
    expect(isSubjectlessBooleanName("isPreviewAssetFinished")).toBe(false);
  });

  it("does not match on prefix alone", () => {
    expect(isSubjectlessBooleanName("isReadyForSubmission")).toBe(false);
    expect(isSubjectlessBooleanName("isAvailableToTeamMembers")).toBe(false);
  });

  it("exempts names whose subject is supplied by the object they sit on", () => {
    for (const implicitSubjectName of [
      "isActive",
      "isVisible",
      "isEnabled",
      "isValid",
      "shouldShow"
    ]) {
      expect(isSubjectlessBooleanName(implicitSubjectName)).toBe(false);
    }
  });

  it("exempts React Aria and TanStack Query contract names", () => {
    for (const contractName of [
      "isDisabled",
      "isSelected",
      "isOpen",
      "isInvalid",
      "isRequired",
      "isReadOnly",
      "isLoading",
      "isPending",
      "isFetching",
      "isError",
      "isSuccess"
    ]) {
      expect(isSubjectlessBooleanName(contractName)).toBe(false);
    }
  });

  it("ignores non-string input", () => {
    expect(isSubjectlessBooleanName(undefined)).toBe(false);
    expect(isSubjectlessBooleanName(42)).toBe(false);
  });

  it("keeps the denylist free of the documented exemptions", () => {
    for (const exemptName of [
      "isActive",
      "isValid",
      "isDisabled",
      "isLoading"
    ]) {
      expect(SUBJECTLESS_BOOLEAN_NAMES.has(exemptName)).toBe(false);
    }
  });
});
