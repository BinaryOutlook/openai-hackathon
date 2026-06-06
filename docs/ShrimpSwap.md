# ShrimpSwap UX Iteration Brief

## Purpose

This update focuses on the next layer of UI/UX refinement after the Shrimp Trio remediation. The current app is much stronger now that the HUD, Human Review, and AI Jury pages are separated, but the HUD and Human Review surfaces can still become denser, calmer, and more judge-friendly.

The direction is fair and worth raising as a **UX iteration request**, not as a bug report. The goal is:

\[
\text{less page scanning} \rightarrow \text{faster case selection} \rightarrow \text{clearer reviewer action}
\]

For desktop, the target should be a no-scroll or near-no-scroll workflow at common judging sizes such as \(1440\times900\). For mobile, a fully scrollless design is unrealistic unless too much information is hidden, so the mobile target should be compact summaries with expandable details and quick access to the primary action.

## Main HUD Changes

### 1. Convert Review Queue Into a Top Queue Launcher

The current Review Queue still takes up the first HUD column. That is useful, but it consumes prime workspace real estate that could be better used by Case Intake or decision context.

Move the Review Queue into the top-center workspace area, near the header/status region. This should become a compact queue launcher rather than a full column.

The collapsed queue launcher should always show numeric operational status:

1. Current case number or current case ID.
2. Completed or reviewed count.
3. Pending case count.
4. Archived case count.

Suggested shape:

- A compact horizontal queue/status bar in the top-center area.
- A primary current-case label.
- Small numerical counters.
- Click or keyboard activation opens an expanded menu.

When expanded, it should show the existing case list and filter options. This keeps the same functionality, but removes a large persistent block from the HUD.

### 2. Move Case Intake Into the Former Queue Position

Once the queue becomes a top launcher, Case Intake should move into the former Review Queue column. This makes the left side more useful because the reviewer can immediately see the active case facts and edit/upload controls.

Acceptance criteria:

- Case Intake appears in the left HUD column.
- Queue controls remain accessible from the top launcher.
- Switching cases still reloads the workflow intentionally.
- Filter state remains visible when the queue menu is expanded.

### 3. Compact the Verdict Workspace

The right-hand Verdict Workspace is still vertically heavy. Some content cannot be compressed without hurting trust, but several sections can be made denser.

Recommended changes:

- Convert vote split into a compact table:
  - Buyer
  - Seller
  - More evidence
  - Escalate
- Convert responsibility into a compact table rather than stacked metric cards.
- Keep confidence and risk score visible, but reduce surrounding padding.
- Compress `Why risky` into two or three short bullet points.
- Make the decision brief shorter by default, with expansion for the full rationale.

This should reduce HUD height while keeping the critical decision signals visible.

### 4. Desktop Scroll Target

The previous wording said there should be "no need to scroll" in the HUD. That is a good design ambition, but it should be scoped carefully.

Use this target instead:

\[
\text{HUD desktop at }1440\times900 \approx \text{no-scroll or near-no-scroll}
\]

For mobile, prioritize:

- no horizontal overflow,
- primary action near the top,
- expandable details,
- no hidden critical decision controls inside nested scroll areas.

## Human Review Page Changes

### 1. Make Human Review Feel Like a Decision Form

The Human Review page should feel like a dense reviewer workstation, not another long audit page. It should prioritize final decision, rationale, evidence relied on, and save/export confidence.

The current Indicators, Warnings, and Review Focus sections can be too wordy. Convert them into short bullet-point summaries.

Recommended layout:

- Left: compact indicators and evidence checklist.
- Center: final verdict, rationale, override reason, notes.
- Right: decision record preview, save state, handoff details.

### 2. Add a Save Draft Button

Even if the current local state already preserves edits while switching tabs, a visible save action helps the user feel secure.

Add a `Save draft` button for reviewer reasoning and decision fields.

Expected behavior:

- Updates a visible saved timestamp.
- Shows a lightweight saved state such as `Draft saved`.
- Does not need backend persistence for the hackathon version unless that is already available.
- Should not replace export validation.

This is partly functional and partly psychological: reviewers should feel that the decision record is safe and intentional.

### 3. Use Decision Record Space Better

The Decision Record panel has room to carry more useful state. It should show:

- record status,
- saved timestamp,
- final verdict,
- rationale completeness,
- selected evidence count,
- system recommendation,
- whether override reason is required.

This makes the panel an active assessment indicator rather than a passive preview.

### 4. Compact Toward a One-Page Desktop Experience

For Human Review, the target should be:

\[
\text{one-page desktop interaction} \quad \text{where possible}
\]

Do not force everything above the fold if that makes the page cramped or stressful. Instead, make the primary decision path fit first:

1. verdict,
2. rationale,
3. evidence relied on,
4. save draft,
5. export readiness.

Secondary calibration/handoff details can be compact, collapsed, or moved lower.

## Implementation Priorities

1. Build the top queue launcher and move the persistent queue list out of the HUD column.
2. Move Case Intake into the former queue position.
3. Compact Verdict Workspace tables and summaries.
4. Convert Human Review indicators into short bullet summaries.
5. Add Save Draft and visible saved-state feedback.
6. Rework Decision Record into an active readiness panel.
7. Validate desktop and mobile screenshots.

## Acceptance Criteria

- HUD desktop at \(1440\times900\) is no-scroll or materially closer to no-scroll than the current layout.
- HUD mobile still has zero horizontal overflow.
- Queue is available as a compact top launcher and expands into the full case list.
- Case Intake occupies the former queue position.
- Verdict Workspace uses compact table-style summaries for vote split and responsibility.
- Human Review has a `Save draft` action and visible saved timestamp/state.
- Human Review indicators are short bullet points, not long paragraphs.
- Export readiness is clear before a reviewer tries to export.
- The UI remains accessible by keyboard and does not introduce tiny tap targets.

## Out of Scope

- Backend persistence for saved drafts.
- Rewriting the jury workflow or routing rules.
- Changing the AI Jury deep reasoning model.
- Removing detailed audit content entirely.

## Final Framing

ShrimpSwap should be raised as a fair and useful next iteration. The strongest version of the request is not "make everything scrollless everywhere." The stronger request is:

> Make the desktop HUD and Human Review views feel like compact command surfaces, while using mobile-friendly summaries and expansion patterns to keep the workflow fast without hiding critical decisions.
