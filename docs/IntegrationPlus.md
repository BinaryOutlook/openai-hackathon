# Integration Plus Implementation Brief

## Purpose

This update should make the demo workflow feel less like a static dashboard and more like a real reviewer operations surface. The core direction is:

\[
\text{AI decision visible} \rightarrow \text{human intervention available} \rightarrow \text{final status explicit}
\]

The existing split between HUD, AI Jury Panel, and Human Review is good. This iteration clarifies the placement of those workspaces, strengthens the cooldown override path, and makes the queue counters represent real demo state.

## Workspace Order

The top workspace tabs should use this order:

1. HUD
2. AI Jury Panel
3. Human Review

AI Jury Panel belongs in the center because it is the main differentiator of the product. Human Review should remain one click away on the right because it is the human closure path after the system has either escalated or been overruled.

## Cooldown Actions

When the workflow returns a provisional AI decision, the cooldown panel should become an action surface, not just a passive note field.

It must show three reviewer actions:

| Action | Required behavior |
| --- | --- |
| Add remark | Saves the current cooldown remark without changing the route. |
| Extend cooldown | Adds \(10\) minutes to the cooldown expiry for demo review time. |
| Overrule | Converts the case into a human-review-required state and opens the Human Review workspace. |

The current overruling textarea is sufficient as the main free-form input. Add a small remark bank with preset text snippets so reviewers can quickly insert common operational notes.

After `Overrule`, the case should behave like any case that the AI originally routed to Human Review:

- Human Review page is fully usable.
- Reviewer can select a final verdict.
- Reviewer can cite evidence.
- Reviewer can add rationale, override reason, and notes.
- Reviewer can escalate to supervisor or submit the case for closure.

## Human Review Actions

Human Review should distinguish draft, handoff, and closure:

| Action | UI treatment | Required behavior |
| --- | --- | --- |
| Save draft | Secondary white button | Updates saved state only. It should not imply the case is closed. |
| Escalate supervisor | Explicit action label | Marks the case as `Done`, because ownership has been handed off but the case is not archived. |
| Submit case | Primary action | Fully closes the case and marks it as `Archived`. |

The final verdict option currently labeled `Escalate` should read `Escalate supervisor` for clarity.

## Queue Counter Semantics

The top queue counters should use these meanings:

\[
\text{Pending} = \text{no final reviewer action yet}
\]

\[
\text{Done} = \text{cooldown active, cooldown handled, or supervisor handoff}
\]

\[
\text{Archived} = \text{submitted and fully closed}
\]

For the demo:

- A provisional AI decision in cooldown counts as `Done`.
- A case that needs human review but has no submitted decision counts as `Pending`.
- A submitted human review decision counts as `Archived`.
- A standard automation case may count as `Archived` because it is solved by policy automation.

The queue UI should make these definitions visible enough that a judge can understand the numbers without asking.

## HUD Case Intake

Case Intake is already useful. The buyer claim and seller response fields are too short for dispute narratives, though.

Required change:

- Buyer claim and seller response should show at least four lines by default.
- On larger layouts, they may use more vertical room if the page already has enough space.
- They should remain bounded so they do not create excessive page height or awkward nested scrolling.

## Acceptance Criteria

- Workspace tab order is `HUD`, `AI Jury Panel`, `Human Review`.
- Provisional AI decision cooldown shows `Add remark`, `Extend cooldown`, and `Overrule`.
- Cooldown remark bank presets can populate the existing remark textarea.
- `Extend cooldown` adds \(10\) minutes to the displayed expiry/remaining time.
- `Overrule` opens the Human Review workspace and uses the same decision form as native human-review routes.
- Human Review has a secondary white `Save draft` button.
- Human Review has a `Submit case` button that marks the case as archived.
- Human Review has an `Escalate supervisor` action that marks the case as done.
- Queue counters reflect `Pending`, `Done`, and `Archived` from demo workflow state, not merely selected-case position.
- Buyer claim and seller response show at least four lines.
- The app still builds and remains usable on desktop and mobile widths.
