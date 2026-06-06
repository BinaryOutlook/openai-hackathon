# Shrimp Trio Remediation Plan

## Status

Planned for implementation after this document is committed.

## Purpose

This document converts [ShrimpTrio.md](./ShrimpTrio.md) and the follow-up factual review into an implementation brief for a contractor or coding agent. The goal is not to make the app prettier in the abstract. The goal is to make the reviewer workspace easier for hackathon judges to inspect quickly, while preserving the deeper audit trail that makes the product credible.

The target user journey is:

\[
\text{Reviewer sees status} \rightarrow \text{understands risk} \rightarrow \text{acts or inspects AI reasoning}
\]

The UI should make the high-signal path obvious on first contact and keep detailed reasoning available one click away.

## Current Evidence

The following claims were verified against the current source and production rendering:

- `npm test` passes with \(16/16\) tests.
- `npm run build` passes.
- The only user-facing app route is `/`; `/api/jury/run` is an API route.
- The brand orange `#ff5722` has insufficient contrast in current text/button pairings:
  - white on `#ff5722`: \(3.16:1\)
  - `#ff5722` on `#ffebe6`: \(2.75:1\)
  - WCAG normal text target is \(4.5:1\)
- Production AI Jury mobile measurement at \(390\times844\):
  - document height: about \(5501\text{px}\)
  - horizontal overflow: about \(162\text{px}\)
  - `Similar Past Cases` appears twice
- Production AI Jury desktop measurement at \(1440\times900\):
  - document height: about \(3183\text{px}\)
  - no horizontal overflow
- `Review Queue` filter chips are buttons without state or behavior.
- `Export` is enabled whenever a workflow result exists, even if human review has no final verdict or rationale.
- Tabs use `role="tab"` but do not provide full tab semantics.
- Uploaded images are stored as base64 data URLs and rendered without `loading` or `decoding`.
- The statement "no demo case exercises `provisional_ai_decision`" is stale for the deterministic no-API workflow: `case-wrong-item` can route to `provisional_ai_decision`. Do not add a redundant demo case unless a later workflow change removes that coverage.

## Product Direction

The current application has the right conceptual split:

- HUD: operational decision surface.
- AI Jury Panel: reasoning, disagreement, evidence trace, and audit details.

The problem is that the HUD still contains too much review machinery, and the AI Jury page starts with repeated juror cards before showing the deliberation and audit signal. The fix should create three clear workspaces:

1. **HUD**
   - Fast scan surface.
   - Shows route, recommendation, risk, evidence summary, and next action.
   - Avoids full human review form and long agent reasoning.

2. **Human Review**
   - Dedicated decision workspace for cases requiring human ownership.
   - Contains final verdict, rationale, evidence relied on, escalation notes, and decision record preview.
   - Should appear as its own workspace tab next to HUD and AI Jury.

3. **AI Jury Panel**
   - Deep reasoning workspace.
   - Starts with deliberation and numerical metrics.
   - Shows compact juror cards by default with full reasoning hidden behind expansion.

## Required Work

### 1. Add a Human Review Workspace

**Files likely involved**

- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)
- [src/app/_components/workspace-tabs.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/workspace-tabs.tsx)
- [src/app/page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx)
- [src/app/_components/hud/human-review.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/human-review.tsx)

**Implementation notes**

- Change `WorkspaceView` from `"hud" | "ai-jury"` to include `"human-review"`.
- Add a third tab labeled `Human Review`.
- Render `HumanReviewPanel` in the new view, not inside the HUD.
- In the HUD, replace the large human review form with a compact summary and a clear path to the Human Review tab.
- If the current route does not require human review, the Human Review view should show a concise non-blocking empty state or route-specific message.
- Keep decision state shared across views so users can inspect AI Jury and return without losing edits.

**Acceptance criteria**

- HUD no longer displays the full human decision composer.
- A user can switch among HUD, Human Review, and AI Jury.
- Human review controls remain available for `human_review` routes.
- Decision draft state persists when switching tabs.
- Mobile first screen is less crowded than the current HUD.

### 2. Reorder and Compress the AI Jury Panel

**Files likely involved**

- [src/app/page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx)
- [src/app/_components/ai-jury.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ai-jury.tsx)
- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)

**Implementation notes**

- Render `DeliberationPanel` before `JuryPanel`.
- Keep numerical signals prominent:
  - route
  - vote split
  - confidence
  - risk score
  - recommendation
  - evidence IDs
- Move repeated or lower-priority blocks out of the first viewport.
- Remove the duplicate `SimilarPastCases` placement. Keep one placement only, preferably in the right audit column on desktop or after audit context on mobile.
- Replace each juror's pre-expansion summary with:
  - bold decision/vote label
  - confidence
  - at most two bullets
  - each bullet should be short enough to scan, target \( \leq 20 \) words total per card summary if feasible
- Keep `Full reasoning` available through `<details>`.

**Acceptance criteria**

- On AI Jury, `Deliberation` appears before `Jury Panel`.
- Each juror card is visibly shorter before expansion.
- `Similar Past Cases` appears once.
- Mobile AI Jury document height is materially reduced from the current \(5501\text{px}\) baseline.
- Mobile AI Jury has no horizontal overflow at \(390\times844\).

### 3. Fix Color Contrast and Token Usage

**Files likely involved**

- [tailwind.config.ts](/Users/leoliang/StudyMain/openai-hackathon/tailwind.config.ts)
- [src/app/globals.css](/Users/leoliang/StudyMain/openai-hackathon/src/app/globals.css)
- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)
- UI components using `text-teal`, `bg-teal`, `#ff5722`, `#ffebe6`, or `#fff7f4`

**Implementation notes**

- Treat `#ff5722` as a brand accent, not normal body text.
- Use darker accessible text colors for orange-tinted surfaces, such as `#bf360c` or charcoal.
- Keep orange for fills, icons, borders, or large marks when contrast allows.
- Replace scattered raw hexes with semantic tokens where practical.
- Do not repaint the whole app into a one-note orange theme. Keep neutral surfaces and restrained accent use.

**Acceptance criteria**

- Normal text on colored/tinted surfaces reaches \(4.5:1\) where WCAG text contrast applies.
- Interactive orange text links/buttons are readable on desktop and mobile.
- Primary button text no longer relies on white over `#ff5722` for small text.
- Raw hex usage is reduced or centralized for the affected components.

### 4. Improve Tap Targets and Tab Semantics

**Files likely involved**

- [src/app/_components/workspace-tabs.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/workspace-tabs.tsx)
- [src/app/_components/hud/review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx)
- [src/app/_components/hud/case-intake.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/case-intake.tsx)
- [src/app/_components/ai-jury.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ai-jury.tsx)
- [src/app/_components/ui.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ui.tsx)

**Implementation notes**

- Raise key controls to at least `min-h-11` where space allows. For cramped inline controls, keep WCAG \(2.5.8\) in mind: the minimum target is \(24\times24\), but mobile comfort is closer to \(44\times44\).
- `summary` controls for `Full reasoning` need a larger click/tap area.
- Add full tab semantics:
  - `aria-controls`
  - `id`
  - matching `tabpanel`
  - roving `tabIndex`
  - left/right arrow navigation
- Do not invent custom keyboard behavior beyond the tabs.

**Acceptance criteria**

- Workspace tabs are keyboard-operable with arrow keys.
- Active tab and tab panel are correctly associated.
- Main buttons and expandable reasoning controls are comfortable on mobile.
- No tiny \(20\text{px}\) or \(26\text{px}\) primary interaction targets remain in the main workflow.

### 5. Make Queue Filters Honest

**Files likely involved**

- [src/app/_components/hud/review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx)
- [src/app/page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx)
- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)

**Implementation options**

Option A, preferred:

- Implement real filter state.
- Use `aria-pressed` on filter chips.
- Filter `DEMO_CASES` according to queue metadata or route signals.

Option B, acceptable if time is tight:

- Render chips as non-interactive labels.
- Remove hover affordances and button semantics.

**Acceptance criteria**

- Filter chips either change the visible queue or no longer look clickable.
- If interactive, selected filters are visible and announced through `aria-pressed`.

### 6. Gate Export for Human Review

**Files likely involved**

- [src/app/page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx)
- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)
- [src/app/_components/hud/human-review.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/human-review.tsx)

**Implementation notes**

- Export should remain enabled for standard automation and finalized/provisional AI decisions when no human verdict is required.
- For `human_review`, export should require:
  - final verdict
  - non-empty rationale
  - evidence relied on, if the workflow expects a decision record
- If invalid, either disable export with a clear visible reason or show inline validation after click.
- Avoid trapping users with no explanation.

**Acceptance criteria**

- A human-review export cannot produce `decision: "not_selected"` with an empty rationale.
- The UI explains what is missing.
- Existing non-human-review export paths still work.

### 7. Reduce Internal Scroll Traps

**Files likely involved**

- [src/app/_components/ui.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ui.tsx)
- [src/app/_components/hud/review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx)
- [src/app/_components/hud/evidence-board.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/evidence-board.tsx)

**Implementation notes**

- Prefer normal page flow for the main review path.
- Keep internal scrolling only where it clearly improves scanning and does not hide critical content.
- If keeping an internal scroll region, ensure it is obvious and not nested inside another scroll-heavy panel.

**Acceptance criteria**

- The main workflow can be scanned with page scrolling.
- Critical indicators, final recommendation, and decision controls are not hidden inside small nested scroll regions.

### 8. Improve Evidence Image Handling

**Files likely involved**

- [src/app/_lib/workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts)
- [src/app/_components/hud/evidence-board.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/evidence-board.tsx)

**Implementation notes**

- Add `loading="lazy"` and `decoding="async"` to rendered evidence images.
- Consider replacing base64 state with object URLs if time allows.
- If object URLs are added, revoke them when no longer needed.
- If base64 remains, cap or reject very large uploads to avoid memory spikes.

**Acceptance criteria**

- Evidence image rendering includes browser loading/decoding hints.
- Large uploads are not allowed to silently balloon UI state.

## Implementation Order

Recommended sequence:

1. Add the Human Review workspace tab and move the full human review panel out of HUD.
2. Reorder AI Jury so deliberation comes first, then compress juror summaries.
3. Remove duplicate Similar Past Cases and fix mobile overflow.
4. Fix export validation and queue filters.
5. Harden tabs, tap targets, contrast, and image rendering.
6. Run screenshots and tests.

This order makes the largest hackathon-judge improvement early, then closes accessibility and integrity gaps.

## Suggested Subagent Split

If multiple agents work in parallel, use non-overlapping ownership:

- **Agent A: Workspace IA**
  - Owns `page.tsx`, `workspace-tabs.tsx`, and `workspace.ts`.
  - Adds the third workspace, tab semantics, and export gating helpers.

- **Agent B: AI Jury Compression**
  - Owns `ai-jury.tsx`.
  - Reorders deliberation, compresses juror cards, removes duplicate similar cases, and checks mobile overflow.

- **Agent C: HUD/accessibility polish**
  - Owns `review-queue.tsx`, `case-intake.tsx`, `evidence-board.tsx`, `ui.tsx`, `globals.css`, and `tailwind.config.ts`.
  - Fixes filter behavior, tap targets, contrast, scroll traps, and evidence image hints.

Agents must not revert each other's edits. If a file boundary must change, coordinate before editing the same file.

## Verification Plan

Run:

```bash
npm test
npm run build
```

Then run production UI validation, not only `next dev`:

```bash
npm run start -- --hostname 127.0.0.1 --port 3001
```

Validate screenshots or DOM measurements at:

- \(1440\times900\)
- \(390\times844\)

Check:

- HUD first viewport is calmer and no longer includes the full human review composer.
- Human Review tab exists and can draft a decision.
- AI Jury order is Deliberation first, Jury Panel second.
- `Similar Past Cases` appears once.
- No horizontal overflow at \(390\times844\).
- Main tap targets are at least \(44\text{px}\) where they are primary controls, and at least \(24\text{px}\) for WCAG \(2.5.8\)-style minimum targets.
- Export is blocked or validated for incomplete human review decisions.
- Queue filters either work or are no longer interactive.

## Out of Scope

- Replacing the jury algorithm.
- Adding backend persistence for decision records.
- Reworking the OpenAI/live jury integration.
- Adding a new design system dependency.
- Changing demo case policy semantics unless required by tests.

## Definition of Done

The remediation is complete when:

- The implementation satisfies all acceptance criteria above.
- `npm test` and `npm run build` pass.
- Production screenshots at desktop and mobile show no incoherent overlap or horizontal overflow.
- The committed diff is scoped to the plan.
- Any remaining known limitation is documented in the final handoff.
