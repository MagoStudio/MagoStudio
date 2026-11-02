import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import {
  ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD,
  findEscalatingZIndexUtilities,
  rule
} from "./no-arbitrary-z-index.js";

// Wire oxlint's RuleTester to vitest so its cases run as vitest tests.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

// Class strings are assembled from parts so the fixtures do not trip the rule
// on this file itself.
const arbitrary = (value: string) => `z-` + `[${value}]`;
const bareNumeric = (value: string) => `z-` + value;

ruleTester.run("no-arbitrary-z-index", rule, {
  valid: [
    {
      // A named token is exactly what the rule asks for.
      filename: "/repo/src/components/Toast/ToastPile.tsx",
      code: `const className = "fixed inset-0 z-supermodal pb-5";`
    },
    {
      // Tailwind's own numeric scale is not an arbitrary value.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute z-10 top-2";`
    },
    {
      // A small local value inside a scoped stacking context is the GOOD
      // pattern — see the THRESHOLD note in the rule.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${arbitrary("1")} ${arbitrary("5")}";`
    },
    {
      // Just under the threshold.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${arbitrary("99")}";`
    },
    {
      // An arbitrary value for a property that is not z-index must not match.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "bottom-[64px] max-w-[746px]";`
    },
    {
      // Magnitude is not statically known, so the rule does not judge it.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${arbitrary("var(--x)")}";`
    },
    {
      // A class merely containing the letter z must not match.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "size-[20px] blaze-[3px]";`
    },
    {
      // Just under the threshold, bare numeric form.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${bareNumeric("99")}";`
    }
  ],
  invalid: [
    {
      // The case the z-index audit found.
      filename: "/repo/src/app/project/components/HelpButton/TawkWidget.tsx",
      code: `const className = "absolute top-2 right-2 ${arbitrary("9999")}";`,
      errors: 1
    },
    {
      // The case the two fullscreen-overlay dialogs reached — bare numeric
      // form, never caught before this rule gained it.
      filename: "/repo/src/app/project/components/Viewport/Fullscreen.tsx",
      code: `const className = "fixed inset-0 ${bareNumeric("1414")}";`,
      errors: 1
    },
    {
      // Bare numeric, exactly at the threshold.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${bareNumeric("100")}";`,
      errors: 1
    },
    {
      // A large negative bare-numeric value is equally an escalation.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute -${bareNumeric("400")}";`,
      errors: 1
    },
    {
      // Both forms in one string are each reported.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "${arbitrary("500")} ${bareNumeric("600")}";`,
      errors: 2
    },
    {
      // Exactly at the threshold.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute ${arbitrary("100")}";`,
      errors: 1
    },
    {
      // Variant prefixes still reach the utility.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "hover:${arbitrary("500")} md:${arbitrary("900")}";`,
      errors: 2
    },
    {
      // Template literals are where conditional classes live.
      filename: "/repo/src/components/Foo/index.tsx",
      code: "const className = `absolute " + arbitrary("500") + " ${extra}`;",
      errors: 1
    },
    {
      // A large negative arbitrary value is equally an escalation.
      filename: "/repo/src/components/Foo/index.tsx",
      code: `const className = "absolute -${arbitrary("400")}";`,
      errors: 1
    }
  ]
});

describe("findEscalatingZIndexUtilities", () => {
  it("returns every escalating arbitrary z-index utility", () => {
    expect(
      findEscalatingZIndexUtilities(
        `absolute ${arbitrary("9999")} hover:${arbitrary("500")}`
      )
    ).toEqual(["z-[9999]", "z-[500]"]);
  });

  it("ignores small local values, which are the good pattern", () => {
    expect(
      findEscalatingZIndexUtilities(
        `${arbitrary("1")} ${arbitrary("5")} ${arbitrary("99")}`
      )
    ).toEqual([]);
  });

  it("ignores named tokens and the numeric scale", () => {
    expect(findEscalatingZIndexUtilities("z-supermodal z-modal z-10")).toEqual(
      []
    );
  });

  it("ignores arbitrary values for other properties", () => {
    expect(findEscalatingZIndexUtilities("bottom-[64px] w-[50vw]")).toEqual([]);
  });

  it("ignores a value whose magnitude is not statically known", () => {
    expect(
      findEscalatingZIndexUtilities(arbitrary("calc(var(--x) + 1)"))
    ).toEqual([]);
  });

  it("matches a utility at the very start of the string", () => {
    expect(
      findEscalatingZIndexUtilities(`${arbitrary("420")} absolute`)
    ).toEqual(["z-[420]"]);
  });

  it("treats the threshold as inclusive", () => {
    const atThreshold = String(ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD);
    const belowThreshold = String(ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD - 1);
    expect(findEscalatingZIndexUtilities(arbitrary(atThreshold))).toHaveLength(
      1
    );
    expect(
      findEscalatingZIndexUtilities(arbitrary(belowThreshold))
    ).toHaveLength(0);
  });

  it("returns nothing for a non-string input", () => {
    expect(findEscalatingZIndexUtilities(undefined)).toEqual([]);
    expect(findEscalatingZIndexUtilities(42)).toEqual([]);
  });

  it("returns every escalating bare-numeric z-index utility", () => {
    expect(
      findEscalatingZIndexUtilities(
        `absolute ${bareNumeric("1414")} hover:${bareNumeric("500")}`
      )
    ).toEqual(["z-1414", "z-500"]);
  });

  it("ignores small bare-numeric values, which are Tailwind's own scale", () => {
    expect(
      findEscalatingZIndexUtilities(
        `${bareNumeric("10")} ${bareNumeric("20")} ${bareNumeric("99")}`
      )
    ).toEqual([]);
  });

  it("treats the bare-numeric threshold as inclusive", () => {
    const atThreshold = String(ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD);
    const belowThreshold = String(ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD - 1);
    expect(
      findEscalatingZIndexUtilities(bareNumeric(atThreshold))
    ).toHaveLength(1);
    expect(
      findEscalatingZIndexUtilities(bareNumeric(belowThreshold))
    ).toHaveLength(0);
  });

  it("does not double-report a bracketed value as a bare numeric", () => {
    expect(findEscalatingZIndexUtilities(arbitrary("500"))).toEqual([
      "z-[500]"
    ]);
  });

  it("reports both forms when both appear", () => {
    expect(
      findEscalatingZIndexUtilities(
        `${arbitrary("9999")} ${bareNumeric("500")}`
      )
    ).toEqual(["z-[9999]", "z-500"]);
  });
});
