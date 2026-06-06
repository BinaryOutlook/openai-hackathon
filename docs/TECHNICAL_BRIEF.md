# AI Return Jury Technical Brief

## Purpose

This brief turns the approved MVP routing flow from [MVP_TRAITS.md](./MVP_TRAITS.md) into an implementation guide for contractors, contributors, and parallel AI subagents.

The approved product stance is:

> AI is not used for every return. Uncontested cases bypass the AI jury. AI is reserved for disputed, risky, ambiguous, or SOP-sensitive cases where it can summarize evidence, surface warnings, and prepare human-review context.

The technical work should preserve that stance. A correct implementation is not the one that maximizes AI usage; it is the one that routes each case to the simplest defensible path.

## Current Codebase Snapshot

| Area | Current file(s) | Current behavior |
| --- | --- | --- |
| UI shell | `src/app/page.tsx` | Single client component with case intake, evidence board, verdict panel, jury panel, deliberation panel, image upload, and JSON export. |
| API endpoint | `src/app/api/jury/run/route.ts` | Validates `JuryCaseInput`, runs live OpenAI jury when `OPENAI_API_KEY` exists, otherwise falls back to mock jury. |
| Core schemas | `src/types/jury.ts` | Defines evidence, case input, agent opinions, final verdict, and jury run result. |
| Jury agents | `src/lib/jury/agents.ts` | Defines 7 agent roles. |
| Live model path | `src/lib/jury/openai.ts` | Runs all agents in parallel, uses structured JSON output, then asks a foreperson to summarize. |
| Mock path | `src/lib/jury/mock.ts` | Deterministic demo responses for known case families. |
| Scoring | `src/lib/jury/scoring.ts` | Computes vote summary, vote margin, confidence, escalation, responsibility, and recommended actions. |
| Tests | `src/lib/jury/scoring.test.ts` | Covers decisive wrong-item case, high-value escalation, and prompt-injection escalation. |

Important current gap: the app currently runs the jury directly for selected demo cases. It does not yet implement the approved pre-jury routing layer, uncontested bypass, provisional AI decision cooldown, or human override record.

## Approved Workflow Contract

The implementation should follow this exact routing spine:

1. Collect request data.
2. Check whether the case is uncontested.
3. If uncontested, use standard platform automation and do not invoke the AI jury.
4. If disputed, excluded, risky, or ambiguous, enter the request auto-selection layer.
5. If fraud, SOP trigger, or return exclusion is detected, route to human review with AI jury context, indicators, and warnings.
6. If no hard human-review trigger exists, check AI confidence.
7. If confidence is insufficient, route to human review with AI explanation.
8. If confidence is sufficient, create a provisional AI decision.
9. Start a 60-second cooldown.
10. If human override is submitted, the human overruling point becomes the final decision record.
11. If no override is submitted, the AI decision becomes final after cooldown.
12. Export an audit record with evidence IDs and routing reason.

This route can be treated as:

\[
\operatorname{route}(x) =
\begin{cases}
\text{Standard automation}, & U(x) = 1 \\
\text{Human review}, & F(x) = 1 \lor S(x) = 1 \lor C(x) < \tau \\
\text{Provisional AI decision}, & C(x) \geq \tau \land F(x) = 0 \land S(x) = 0
\end{cases}
\]

Where \( U(x) \) is uncontested, \( F(x) \) is fraud/manipulation risk, \( S(x) \) is mandatory SOP or exclusion, \( C(x) \) is AI confidence, and \( \tau \) is the confidence threshold.

## Target Domain Model

Add explicit routing concepts instead of hiding routing inside verdict text.

Recommended additions in `src/types/jury.ts`:

```typescript
export const evidenceSourceSchema = z.enum([
  "buyer",
  "seller",
  "platform_policy",
  "logistics",
  "history",
  "reviewer"
]);

export const requestReasonSchema = z.enum([
  "do_not_want_anymore",
  "description_mismatch",
  "material_mismatch",
  "size_mismatch",
  "production_or_warranty_mismatch",
  "color_style_model_mismatch",
  "quality_issue",
  "missing_item_or_accessory",
  "damaged_or_dirty_item"
]);

export const routeKindSchema = z.enum([
  "standard_automation",
  "human_review",
  "provisional_ai_decision"
]);
```

Recommended new types:

| Type | Purpose |
| --- | --- |
| `EvidenceSource` | Labels who supplied each evidence item. Required for traceability and fraud guardrails. |
| `RequestReason` | Captures preselected user reasons from the return UI. |
| `RoutingDecision` | Stores `routeKind`, `routingReason`, `warnings`, `requiresJury`, `cooldownSeconds`, and `auditTrail`. |
| `HumanOverride` | Stores override status, overruling point, reviewer ID or placeholder, and timestamp. |
| `WorkflowResult` | Wraps routing output, optional jury result, optional provisional decision, and final audit payload. |

Do not replace existing `JuryRunResult` immediately. Add workflow-level types around it so the current jury behavior remains testable while routing grows around it.

## Suggested File Architecture

Keep business logic out of React components. The current `page.tsx` is already large; new work should push domain behavior into `src/lib/jury`.

Recommended structure:

```text
src/lib/jury/
  agents.ts
  demo-cases.ts
  mock.ts
  openai.ts
  routing.ts              # new: uncontested check, fraud/SOP checks, route selection
  workflow.ts             # new: orchestrates route -> optional jury -> cooldown/audit shape
  audit.ts                # new: builds export-safe audit records
  scoring.ts
  routing.test.ts         # new
  workflow.test.ts        # new

src/app/
  page.tsx                # eventually split into smaller presentational components
  api/jury/run/route.ts   # can delegate to workflow.ts
```

Avoid adding a database in the MVP unless explicitly assigned. For the hackathon demo, in-memory UI state and exportable audit JSON are enough.

## Routing Implementation Detail

Create `src/lib/jury/routing.ts` with pure functions first. Pure functions make the logic testable and reduce merge conflicts.

Recommended functions:

```typescript
export function isUncontestedCase(caseInput: JuryCaseInput): boolean;
export function detectHardEscalation(caseInput: JuryCaseInput): EscalationSignal[];
export function selectRoute(input: RoutingInput): RoutingDecision;
export function getRoutingReason(decision: RoutingDecision): string;
```

Suggested decision order:

1. `isUncontestedCase(caseInput)`:
   - `true` when buyer/seller agree.
   - `true` when request is valid in-scope 7-day no-reason return.
   - `false` when return exclusion, fraud signal, disagreement, missing evidence, or abnormal history exists.
2. `detectHardEscalation(caseInput)`:
   - fraud/manipulation signal.
   - prompt injection.
   - SOP trigger.
   - return exclusion.
   - high-value item if the team chooses high value as mandatory human review.
3. `selectRoute(input)`:
   - standard automation if uncontested.
   - human review if any hard escalation signal exists.
   - human review if AI confidence is below threshold.
   - provisional AI decision otherwise.

Keep thresholds named constants:

```typescript
export const AUTO_DECISION_CONFIDENCE_THRESHOLD = 0.75;
export const PROVISIONAL_DECISION_COOLDOWN_SECONDS = 60;
```

Do not bury magic numbers inside UI code.

## API Contract Direction

The existing endpoint `POST /api/jury/run` can remain, but it should eventually delegate to a workflow orchestrator:

```typescript
const workflowResult = await runReturnWorkflow(caseInput);
return NextResponse.json(workflowResult);
```

Target response shape:

```typescript
type WorkflowResult = {
  route: RoutingDecision;
  jury: JuryRunResult | null;
  humanReviewContext?: {
    indicators: string[];
    warnings: string[];
    suggestedReviewFocus: string[];
  };
  provisionalDecision?: {
    verdict: FinalVerdict;
    cooldownSeconds: 60;
    expiresAt: string;
  };
  audit: AuditRecord;
};
```

Rules:

| Route | Jury execution | API response |
| --- | --- | --- |
| `standard_automation` | Do not call jury. | Return routing reason and standard automation audit record. |
| `human_review` from fraud/SOP/exclusion | Jury may run to summarize context, but final call belongs to human. | Return warnings, indicators, evidence IDs, and review focus. |
| `human_review` from low confidence | Jury runs, then route is human review. | Return confidence details and why automation failed. |
| `provisional_ai_decision` | Jury runs and confidence passes. | Return verdict plus 60-second cooldown metadata. |

## Frontend Direction

The dashboard should mirror the flowchart.

Recommended UI zones:

| UI zone | Purpose |
| --- | --- |
| Intake panel | Select demo case, preselected request reason, buyer/seller text, buyer/seller image uploads. |
| Routing strip | Shows one of: standard automation, human review, provisional AI decision. |
| Evidence board | Shows evidence IDs, source labels, kind, summary, and image previews. |
| AI jury panel | Hidden or collapsed for standard automation; visible for disputed/risky cases. |
| Human review panel | Shows indicators, warnings, suggested review focus, and final-call reminder. |
| Cooldown panel | Shows 60-second countdown and human override input for provisional AI decisions. |
| Audit/export panel | Exports route, evidence, jury output, override, and final decision context. |

When splitting `src/app/page.tsx`, favor presentational components with typed props:

```text
src/app/components/
  CaseIntake.tsx
  RoutingStrip.tsx
  EvidenceBoard.tsx
  JuryPanel.tsx
  HumanReviewPanel.tsx
  CooldownOverridePanel.tsx
  AuditExportButton.tsx
```

Keep state transitions in one place. Do not let each component independently decide route state.

## Parallel Subagent Deployment Plan

Parallel work is useful here, but only if ownership boundaries are strict. Use separate branches or git worktrees so subagents do not overwrite each other.

Recommended setup:

```bash
git fetch origin main
git worktree add ../openai-hackathon-routing codex/routing-core
git worktree add ../openai-hackathon-intake codex/intake-ui
git worktree add ../openai-hackathon-audit codex/audit-export
git worktree add ../openai-hackathon-tests codex/workflow-tests
```

Each subagent should start from updated `main`, own a small file set, run verification, and commit before handoff.

### Subagent A: Routing Core

**Objective:** Implement pure routing logic aligned with the Mermaid flow.

**Files owned:**
- `src/types/jury.ts`
- `src/lib/jury/routing.ts`
- `src/lib/jury/routing.test.ts`

**Acceptance criteria:**
- Uncontested buyer/seller agreement returns `standard_automation`.
- Valid in-scope 7-day return returns `standard_automation`.
- Fraud/SOP/exclusion returns `human_review`.
- Low confidence returns `human_review`.
- Sufficient confidence without hard trigger returns `provisional_ai_decision`.

**Do not touch:**
- `src/app/page.tsx`
- `src/lib/jury/openai.ts`
- styling files

### Subagent B: Workflow Orchestration

**Objective:** Create the server-side orchestration that decides whether to run the jury.

**Files owned:**
- `src/lib/jury/workflow.ts`
- `src/app/api/jury/run/route.ts`
- `src/lib/jury/workflow.test.ts`

**Acceptance criteria:**
- Standard automation path does not call live or mock jury.
- Human review path includes AI context when jury is run.
- Provisional decision path includes `cooldownSeconds: 60`.
- Existing mock fallback remains intact.

**Dependency:** Subagent A's routing types.

### Subagent C: Intake UI

**Objective:** Add request reason options and buyer/seller evidence source labeling.

**Files owned:**
- `src/app/page.tsx` or extracted intake components
- optional `src/app/components/CaseIntake.tsx`
- optional `src/app/components/EvidenceBoard.tsx`

**Acceptance criteria:**
- User can select a preselected request reason.
- Buyer and seller text are visually separated.
- Uploaded image evidence has a clear source label.
- Existing demo case loading still works.

**Dependency:** Shared types from Subagent A.

### Subagent D: Routing and Review UI

**Objective:** Display the route result clearly.

**Files owned:**
- `src/app/components/RoutingStrip.tsx`
- `src/app/components/HumanReviewPanel.tsx`
- `src/app/components/CooldownOverridePanel.tsx`
- minimal wiring in `src/app/page.tsx`

**Acceptance criteria:**
- Standard automation path clearly says no AI jury.
- Human review path clearly says human makes final call.
- Provisional AI decision path shows a 60-second cooldown.
- Human override input can capture an overruling point in local state.

**Dependency:** Subagent B's `WorkflowResult` shape.

### Subagent E: Audit Export

**Objective:** Make export reproduce the routing decision.

**Files owned:**
- `src/lib/jury/audit.ts`
- export logic in `src/app/page.tsx` or `AuditExportButton.tsx`
- audit tests

**Acceptance criteria:**
- Export includes route kind, routing reason, evidence IDs, warnings, jury mode, verdict, and override point when present.
- Export for standard automation includes no jury opinions.
- Export remains valid JSON.

### Subagent F: Demo Data and QA

**Objective:** Add demo cases that exercise every approved route.

**Files owned:**
- `src/lib/jury/demo-cases.ts`
- `src/lib/jury/scoring.test.ts`
- new workflow/routing tests as needed

**Acceptance criteria:**
- One uncontested agreement case.
- One valid 7-day in-scope return case.
- One fraud/SOP human-review case.
- One low-confidence human-review case.
- One provisional AI decision case.

## Integration Order

The integration lead should merge in this order:

1. Subagent A: routing core and types.
2. Subagent F partial: route-specific demo cases that compile against A.
3. Subagent B: workflow orchestration.
4. Subagent E: audit export utilities.
5. Subagent C: intake UI.
6. Subagent D: routing/review/cooldown UI.
7. Subagent F final: end-to-end tests and demo polish.

This order follows the dependency graph: types and pure logic first, orchestration second, UI and audit after contracts stabilize.

## Shared Contracts and Merge Discipline

Subagents must not independently invent response shapes. The integration lead should maintain a shared contract section in `src/types/jury.ts`.

Rules:

1. If a subagent needs a new field, add it to a Zod schema and exported TypeScript type.
2. If the field is user-provided, validate it at the API boundary.
3. If the field appears in an export, include a test showing it is present.
4. If a field affects routing, add a routing test.
5. If a field is only display state, keep it inside the component and do not put it in the domain model.

## Coding Habits

| Habit | Requirement |
| --- | --- |
| Prefer pure functions | Routing, scoring, audit building, and guardrail checks should be pure and unit-tested. |
| Keep UI thin | React components should display state and collect input; they should not own business routing logic. |
| Use Zod at boundaries | API request and response payloads should have schemas before use. |
| Name thresholds | Use exported constants for thresholds and cooldown duration. |
| Avoid hidden side effects | Do not call OpenAI from helpers that appear to be pure. Keep model calls inside explicit orchestration functions. |
| Preserve mock mode | The demo must remain reliable without `OPENAI_API_KEY`. |
| Keep comments purposeful | Comment why a rule exists, especially SOP, fraud, cooldown, and human-override behavior. Do not comment obvious assignments. |
| Keep copy defensible | Use "potential fraud indicators" rather than declaring a party guilty. |

## Annotation Standards for Maintenance

Use short comments where future maintainers need context:

```typescript
// Uncontested cases bypass the AI jury by product decision.
// This prevents AI from being inserted into routine policy automation.
if (isUncontestedCase(caseInput)) {
  return standardAutomationRoute(caseInput);
}
```

Good annotations:
- explain why human review is mandatory.
- explain why an input is treated as untrusted.
- explain why the cooldown exists.
- point to `docs/MVP_TRAITS.md` when implementing the approved flow.

Bad annotations:
- restate what a function name already says.
- preserve old code in comments.
- promise future behavior without a tracked task.

## Testing Strategy

Minimum verification per implementation slice:

```bash
npm test
npm run build
```

Recommended test matrix:

| Test area | Cases |
| --- | --- |
| Routing | uncontested agreement, valid 7-day return, return exclusion, fraud signal, low confidence, sufficient confidence. |
| Workflow | no jury call for standard automation, mock fallback, live failure fallback, cooldown metadata. |
| Audit | includes route, evidence IDs, warnings, override note, final decision path. |
| UI smoke | route strip appears, human review panel appears, cooldown panel appears, export button works. |
| Regression | existing scoring tests still pass. |

For tests that need deterministic data, prefer demo fixtures over ad hoc inline objects. If a fixture becomes noisy, add a small builder function in the test file.

## Security and Guardrails

Buyer and seller content is always untrusted evidence.

Implementation requirements:

1. Keep buyer/seller text separate from system instructions.
2. Label every evidence item by source.
3. Require agent opinions to cite evidence IDs.
4. Detect prompt-injection-like language and route to human review when present.
5. Avoid irreversible actions in the MVP. Export recommendations; do not execute refunds.
6. Do not log API keys, raw secrets, or private environment values.
7. Use size/type checks before accepting large file uploads if productionizing image upload.

## Definition of Done

A slice is done when:

1. The behavior matches the approved Mermaid flow.
2. Pure routing logic has tests.
3. API inputs are validated.
4. UI labels make clear whether AI was skipped, provisional, or human-reviewed.
5. Audit export includes route and evidence IDs.
6. `npm test` passes.
7. `npm run build` passes for UI/API changes.
8. The commit is atomic and has a descriptive message.

## Git Workflow Reminder

Good git behavior is part of the implementation quality.

Recommended branch names:

```text
codex/routing-core
codex/workflow-orchestration
codex/intake-ui
codex/audit-export
codex/cooldown-override
```

Commit rules:

1. Make small atomic commits.
2. Use clear messages: `feat: add uncontested return routing`, `test: cover provisional decision cooldown`, `docs: clarify workflow handoff`.
3. Run `git diff --staged --check` before committing.
4. Scan staged diffs for secrets before committing.
5. Do not stage unrelated generated changes such as `next-env.d.ts` route-type flips unless the task explicitly requires them.
6. Push only after tests pass or clearly document why a verification step could not run.

Pre-commit checklist:

```bash
git status -sb
git diff --staged --check
git diff --staged | rg -i "password|secret|api[_-]?key|token|gho_|sk-" || true
npm test
npm run build
```

Use the commit body to explain why a routing rule exists when the diff alone is not obvious.

## Contractor Handoff Template

Each contractor or subagent should start work with this mini-brief:

```markdown
## Assignment
[One sentence objective]

## Source of truth
- docs/MVP_TRAITS.md
- docs/TECHNICAL_BRIEF.md

## Owned files
- [file list]

## Must not touch
- [file list]

## Acceptance criteria
- [ ] ...
- [ ] ...

## Verification
- [ ] npm test
- [ ] npm run build
- [ ] Manual check: ...

## Commit
Suggested message: `<type>: <short description>`
```

If the contractor discovers that the approved flow is incomplete, they should document the gap and ask for direction before inventing a new route.
