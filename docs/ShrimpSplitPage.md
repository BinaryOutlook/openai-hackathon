# Shrimp Split Page UX Specification

## Purpose

The current reviewer experience places too many workflow layers into one long page. This makes the interface harder to scan, increases scrolling, and blurs the difference between the human decision surface and the AI reasoning surface.

The redesign should split the experience into two primary top-level views:

1. **HUD**
2. **AI Jury Panel**

The objective is not to hide information. The objective is to separate decision-critical information from full reasoning detail so reviewers can act quickly while still having complete audit access when needed.

In short:

\[
\text{HUD} = \text{minimum reliable context needed for action}
\]

\[
\text{AI Jury Panel} = \text{complete reasoning, evidence trace, and audit depth}
\]

No evidence, reasoning, reviewer note, route warning, or decision record should be lost by this split. Information should move to the view where it best supports the workflow.

## Design Principle

The page should feel like an operations decision room, not a long report and not a KPI dashboard.

The reviewer should be able to answer the following questions from the HUD with minimal scrolling:

- What is this case?
- What route did the system choose?
- What is the recommended or required next action?
- Is human review mandatory?
- What evidence matters most?
- What risks or disagreements require attention?
- What decision can I take now?

The AI Jury Panel should answer deeper questions:

- How did each AI agent reason?
- Which evidence did each agent cite?
- Where did agents disagree?
- Why did the system escalate or avoid escalation?
- What similar past cases are relevant?
- What audit trail should be exported or stored?

## Top-Level Navigation

Add a top navigation control near the page header with at least two clickable views:

- **HUD**
- **AI Jury Panel**

The navigation should behave like tabs or segmented navigation. It should be visible near the top of the workflow and should not require the user to scroll to switch views.

Recommended behavior:

- The HUD should be the default view.
- Switching views should not reset the selected case.
- Switching views should not clear uploaded evidence, unsaved reviewer notes, workflow results, or cooldown state.
- The active view should be visually obvious.
- If a workflow is running, both views should show a consistent pending state rather than stale computed results.

## HUD Requirements

The HUD is the primary working surface for human reviewers. It should present only the most relevant operational information needed to make or monitor a decision.

### HUD Must Include

The HUD should contain:

- Case identity: case title, case ID, product/category, order value, and return reason.
- Workflow route: standard automation, human review, or provisional AI decision.
- Current status: pending, running, changes made, up to date, cooldown active, or final.
- Required human action: what the reviewer must do next.
- Decision recommendation: the current automation or AI recommendation when available.
- Evidence summary: the most important buyer, seller, policy, logistics, and reviewer evidence.
- Risk summary: the most important warnings, escalation signals, or disagreement points.
- Human review controls when human review is required.
- Export or audit action when a result exists.

The HUD should avoid showing full agent reasoning by default. It may show compact summaries, but full deliberation belongs in the AI Jury Panel.

### HUD Should Minimize Scrolling

For common cases, the reviewer should be able to understand the case status and take the primary action with little or no vertical scrolling on a normal laptop screen.

Target behavior:

- On desktop and large laptop screens, the HUD should use multi-column layout intelligently.
- On tablet and mobile screens, the HUD should collapse into a clean vertical flow.
- High-priority actions should stay near the top.
- Repeated details should be condensed into summary cards or expandable sections.
- The reviewer should not need to scroll past AI deliberation text before making a human decision.

## AI Jury Panel Requirements

The AI Jury Panel is the full reasoning and audit workspace. It should preserve all detailed AI-generated material and make the system's reasoning inspectable.

### AI Jury Panel Must Include

The AI Jury Panel should contain:

- Agent opinions for all jurors.
- Each agent's vote, confidence, cited evidence, risk flags, recommendation, and full reasoning.
- Vote split and confidence metrics.
- Deliberation timeline.
- Disagreement inspector.
- Agent interaction or challenge summary.
- Recommended actions.
- Final AI rationale.
- Similar past cases or precedent-style references.
- Evidence aliases or IDs used for traceability.
- Route warnings, indicators, and escalation reasons where relevant.

### AI Jury Panel Should Be Detailed, But Organized

Full detail should remain available, but the panel should not become an unstructured wall of text.

Recommended structure:

- Show concise summaries first.
- Put full reasoning behind expandable sections.
- Group agents by vote or risk stance when useful.
- Keep cited evidence close to the reasoning that uses it.
- Show disagreement and escalation reasons before lower-priority narrative detail.
- Preserve Markdown rendering defensively for AI outputs.

## Human Review Requirements

When a case requires human review, the HUD should provide direct decision controls. The reviewer should not need to visit the AI Jury Panel to submit the final human action, although they may use the AI Jury Panel to inspect deeper reasoning before deciding.

### Required Human Actions

The human review control should support these actions:

- **Approve return/refund**
- **Approve with note**
- **Reject with reason**
- **Request more evidence**
- **Escalate**

Avoid relying on **reject without remarks** for production-like flows. A rejection usually needs an explicit reason for fairness, auditability, and dispute handling. If the demo keeps a "reject without remarks" option, the system must still store an automatic rationale explaining the rule or evidence basis for the rejection.

### Decision Record

Every human decision should create a structured decision record.

The record should include:

- Case ID.
- Reviewer decision.
- Reviewer reason or note.
- Override reason if the human decision differs from the system recommendation.
- Evidence relied on.
- Relevant AI recommendation.
- Route kind.
- Risk warnings and escalation signals.
- Similar past case references when available.
- Timestamp.
- Export status or persistence status.

The goal is to make later case comparison possible. Over time, stored decisions can support precedent-style analysis:

\[
\text{Past decisions} + \text{case features} + \text{outcomes} \rightarrow \text{better reviewer calibration}
\]

This should not be presented as a legal system clone. It is an operational precedent and calibration layer for marketplace dispute handling.

## Storage and Audit Expectations

For the current MVP, storing the decision in the exported workflow audit JSON is acceptable if there is no database.

For a production-ready or contractor-built version, the decision record should be persisted in a suitable backend location, such as:

- A case review table.
- A workflow audit table.
- A reviewer decision table.
- A case history collection.

The persistence design should allow future queries such as:

- Show similar past cases.
- Compare AI recommendation against human decision.
- Identify frequent override reasons.
- Analyze which evidence types changed outcomes.
- Track reviewer calibration over time.

## Responsive Layout Requirements

The redesign should improve aspect-ratio compatibility and make better use of available screen space.

The current concern is valid: wide screens should not waste useful space while dense content remains vertically stacked. However, "no blank spaces" should not mean stretching every text block across the full viewport. Readability still matters.

The target principle is:

\[
\text{Extra width} \rightarrow \text{more useful panels, not longer unreadable text lines}
\]

### Desktop and Wide Screens

On larger screens:

- Use available width for side-by-side panels.
- Keep the HUD summary, evidence, and decision controls visible without excessive scrolling.
- Consider sticky or persistent summary areas for route, status, and primary action.
- Avoid a narrow centered layout when there is enough width for meaningful extra columns.
- Preserve readable text widths inside dense reasoning blocks.

### Medium Screens

On medium screens:

- Use two-column layouts where comfortable.
- Keep decision controls above deep reasoning.
- Avoid placing critical action buttons below long evidence or AI text.

### Mobile and Small Screens

On small screens:

- Collapse into a single-column layout.
- Keep top navigation easy to tap.
- Place route, status, and primary action before secondary details.
- Use expandable sections for detail-heavy content.
- Avoid horizontal scrolling.

## Information Architecture

Recommended distribution of existing page sections:

| Section | Preferred View | Notes |
| --- | --- | --- |
| Header and global actions | Both | Keep route status, run workflow, export, and active view visible near top. |
| Workflow progress | HUD | A compact version may appear in AI Jury Panel if useful. |
| Reviewer snapshot | HUD | This is core HUD material. |
| Review queue | HUD | Keep compact and operational. |
| Case intake | HUD | Editing belongs close to reviewer workflow. |
| Evidence board | HUD | Show summarized evidence; allow expansion for full detail. |
| Verdict workspace | HUD | This is decision-critical. |
| Human review panel | HUD | Human decision controls belong here. |
| Cooldown override | HUD | This is an action surface. |
| Jury panel | AI Jury Panel | Full agent opinions belong here. |
| Deliberation | AI Jury Panel | Full reasoning and timeline belong here. |
| Similar past cases | AI Jury Panel, with HUD summary optional | HUD may show only top one or two precedent hints. |
| Risk panel | HUD summary and AI Jury detail | Keep critical risk visible in HUD; full detail can live in AI Jury Panel. |

## State and Data Consistency

The split-page experience must preserve workflow state.

Implementation requirements:

- Selected case must persist across view switches.
- Uploaded evidence must persist across view switches.
- Reviewer draft decisions must persist across view switches.
- Running workflow state must be reflected consistently in both views.
- Stale AI-generated sections must be hidden or marked pending after case edits.
- Exported audit data must include the current reviewer decision and current workflow result.
- No view should show outdated AI reasoning as if it were current after inputs change.

## Acceptance Criteria

The implementation should be considered successful when all of the following are true:

- A reviewer can switch between HUD and AI Jury Panel from the top of the page.
- The HUD is the default view.
- The HUD shows the case status, route, required action, key evidence, key risk, and decision controls.
- Full agent reasoning is not shown by default on the HUD.
- The AI Jury Panel preserves all juror opinions, deliberation, disagreement, rationale, and similar case details.
- Human review actions can be submitted or drafted from the HUD.
- Human decisions store structured reason, evidence, override, and timestamp data.
- Exported audit data includes the reviewer decision and AI workflow context.
- Wide screens use additional space for useful layout, not only centered whitespace.
- Mobile layouts remain usable without horizontal scrolling.
- Workflow running, stale inputs, and pending states are visually clear in both views.
- No detail available in the original single-page experience becomes inaccessible after the split.

## Suggested Implementation Approach

A practical contractor or agent implementation can follow this order:

1. Add view state for `hud` and `ai-jury-panel`.
2. Add top-level navigation for switching views.
3. Move existing summary, evidence, verdict, human review, and cooldown sections into the HUD view.
4. Move existing jury, deliberation, disagreement, agent interaction, and similar past case sections into the AI Jury Panel view.
5. Keep global header actions visible above both views.
6. Ensure workflow state, reviewer draft state, and uploaded evidence state survive view switching.
7. Refine desktop, tablet, and mobile layout behavior.
8. Verify export includes reviewer decision and workflow audit context.
9. Test standard automation, human review, low-confidence human review, and provisional AI decision cases.

## Non-Goals

This redesign should not:

- Remove detailed AI reasoning.
- Turn the page into a generic analytics dashboard.
- Hide human review responsibilities behind AI output.
- Stretch long text across ultrawide screens for the sake of filling space.
- Require a database for the MVP if export-based audit is the current storage boundary.
- Change the underlying jury scoring logic unless explicitly requested.

## Final Product Intent

The final experience should feel faster, calmer, and more trustworthy.

The reviewer should live mostly in the HUD, using it to understand status and make decisions. The AI Jury Panel should remain one click away for deeper inspection, dispute explanation, and audit confidence.

The split succeeds when the UI becomes less cluttered without becoming less transparent.
