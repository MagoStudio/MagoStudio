/**
 * oxlint rule: no-arbitrary-z-index
 *
 * An ad-hoc `z-[…]` value large enough to be reaching for global paint order
 * must name a token from the z-index scale in `src/app/styles/tailwind-theme.css`
 * instead.
 *
 * The failure this prevents is escalation: a layering bug is diagnosed as "my
 * element is underneath", answered with a bigger number, and the number does
 * nothing. An audit of this codebase measured exactly that — above an `OverlayDialog`,
 * React Aria's `ariaHideOutside` sets `inert` on every non-modal body child, and
 * an inert element is removed from hit-testing regardless of z-index. A probe
 * lost at 1411 and at 9999 alike. So a big arbitrary value is never the fix, and
 * this rule stops the attempt where it is written.
 *
 * THRESHOLD, and why it is not zero. A small arbitrary value is the *good*
 * pattern, not the bad one: `z-[1]` or `z-[5]` inside a component that already
 * creates a stacking context is a local ordering concern, correctly scoped, and
 * competing with nothing outside itself. Flagging those would put this rule in
 * conflict with the z-index token cleanup, which moved app-level tokens *towards* small scoped
 * values — the six survivors (`menu`, `help-button`, `modal`, `toast`,
 * `popover`, `tooltip`, at 100–600) are the only ones left on the shared
 * scale; everything else is a local value like the ones this threshold
 * protects. Measured against `src/` when this rule was written, a
 * zero-threshold version produced 4 hits of which 3 were that pattern — a
 * three-quarters false-positive rate, which is how a lint rule teaches people to
 * ignore it.
 *
 * So the rule fires at `ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD` and above. Three
 * digits is an attempt at page-wide ordering; one or two is local.
 *
 * SCOPE: string and template literals, which is where Tailwind classes live in
 * this codebase. Variant prefixes are matched, so `hover:z-[500]` is reported.
 * Non-numeric arbitrary values (`z-[var(--x)]`, `z-[calc(…)]`) are NOT judged —
 * their magnitude is not statically known, and they are deliberate enough to be
 * a review concern rather than a lint one. A genuinely unavoidable case takes an
 * `oxlint-disable-next-line local/no-arbitrary-z-index` with a reason;
 * `HelpButton/TawkWidget` is the one such site, because it must
 * outrank an SDK-injected iframe this codebase does not control.
 *
 * BARE NUMERIC FORM: Tailwind also accepts `z-<number>` with no brackets — this
 * is how the two fullscreen-overlay dialogs reached `z-1414` unremarked, since
 * the bracketed-only version of this rule never saw it. The bare form is judged
 * by the same threshold and reported the same way as the bracketed form.
 * `z-menu`, `z-modal` and the other named tokens are untouched: they are not
 * digits, so they never match either pattern.
 *
 * NOT covered: a negative named token. A negated token (`-z-modal`, say) could
 * compute to a positive or negative magnitude depending on the token's own
 * sign, and judging that needs the token's value, which a rule reading class
 * strings does not have. The token cleanup hit exactly this at `InputVideoTrackItem`
 * (`-z-backdrop` negated an already-negative token, so it silently computed to
 * `+1`) and fixed it by renaming, not by teaching this rule to compute — see
 * `src/app/styles/tailwind-theme.css` for the current scale.
 */

/**
 * At or above this, an arbitrary z-index reads as an attempt at page-wide paint
 * order rather than a local one. See the THRESHOLD note above.
 */
const ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD = 100;

/** Matches a Tailwind arbitrary z-index utility, with or without variant prefixes. */
const ARBITRARY_Z_INDEX_PATTERN = /(?:^|[\s:])(-?z-\[([^\]]+)\])/g;

/** Matches a Tailwind bare-numeric z-index utility, with or without variant prefixes. */
const BARE_NUMERIC_Z_INDEX_PATTERN = /(?:^|[\s:])(-?z-(\d+))(?![\w-])/g;

/**
 * Every escalating utility in `text` matched by `pattern`, where the
 * magnitude lives in the match's third capture group.
 *
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {string[]}
 */
const findEscalatingMatches = (text, pattern) => {
  const escalating = [];
  for (const match of text.matchAll(pattern)) {
    const [, utility, rawValue] = match;
    const magnitude = Math.abs(Number(rawValue));
    if (!Number.isFinite(magnitude)) continue;
    if (magnitude < ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD) continue;
    escalating.push(utility);
  }
  return escalating;
};

/**
 * Every arbitrary or bare-numeric z-index utility in `text` whose magnitude
 * reaches the escalation threshold. Pure, so it is unit-testable without a
 * lint run.
 *
 * @param {unknown} text
 * @returns {string[]}
 */
const findEscalatingZIndexUtilities = (text) => {
  if (typeof text !== "string") return [];
  return [
    ...findEscalatingMatches(text, ARBITRARY_Z_INDEX_PATTERN),
    ...findEscalatingMatches(text, BARE_NUMERIC_Z_INDEX_PATTERN)
  ];
};

/** @type {import("oxlint/plugins-dev").Rule} */
const rule = {
  meta: {
    schema: []
  },
  create(context) {
    const reportUtilities = (node, text) => {
      for (const utility of findEscalatingZIndexUtilities(text)) {
        context.report({
          node,
          message: `"${utility}" reaches for page-wide paint order with an ad-hoc value. Name a token from the z-index scale in src/app/styles/tailwind-theme.css, or scope the element in its own stacking context and use a small value. Above a modal no z-index works at all — the element is inert.`
        });
      }
    };

    return {
      Literal: (node) => reportUtilities(node, node.value),
      TemplateElement: (node) => reportUtilities(node, node.value?.cooked)
    };
  }
};

export default rule;
export {
  ARBITRARY_Z_INDEX_ESCALATION_THRESHOLD,
  ARBITRARY_Z_INDEX_PATTERN,
  findEscalatingZIndexUtilities,
  rule
};
