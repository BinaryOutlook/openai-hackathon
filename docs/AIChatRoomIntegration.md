# AI Chatroom Integration Plan

## Feasibility

Yes, this is possible, and the safest path is to start from `main`.

`main` already has the better reviewer experience: the review queue, HUD layout, evidence board, human review workspace, verdict composer, audit rail, and modular components. `AI-Discuss` has the more compelling jury intelligence pattern: agents open with independent opinions, respond to each other, revise their stances, and then produce a consensus.

The target integration should therefore be:

\[
\text{main UI/UX} + \text{AI-Discuss chatroom jury contract}
\]

This should not be a blind merge from `AI-Discuss`, because that branch deletes many of `main`'s modular UI files and folds the interface back into a large `page.tsx`. The right move is a surgical transplant of the AI chatroom data model, jury execution, and chatroom component into `main`.

## Product Goal

Keep the existing `main` reviewer workspace, but upgrade the AI Jury page so it shows a live-feeling agent chatroom during workflow execution and a traceable deliberation result after completion.

Desired AI Jury page order:

During thinking/running:

\[
\text{Agent Chatroom}
\]

After workflow is ready:

\[
\text{Deliberation} \rightarrow \text{Agent Chatroom}
\]

The reviewer should first see the agents "talking" while the workflow is running. Once the final result is available, the deliberation panel should move to the top because the reviewer now needs the answer, rationale, disagreement summary, and next actions before inspecting the transcript.

## Current Branch Roles

### `main`

Strengths:

- Modular frontend structure under `src/app/_components`.
- Strong reviewer-first HUD and AI Jury tab layout.
- Human review composer, evidence aliases, stale-output handling, export flow, and audit rail.
- Better long-term maintainability.

Limitations:

- Jury logic is mostly linear: independent opinions are shown as cards.
- `DeliberationPanel` includes an "Agent Interaction" disclosure, but it does not feel like a real multi-agent discussion.
- During `isRunning`, computed AI sections are intentionally hidden or pending, so there is no active chatroom experience yet.

### `AI-Discuss`

Strengths:

- Adds a stronger mental model:

\[
\text{opening opinions} \rightarrow \text{revision turns} \rightarrow \text{consensus}
\]

- Adds `initialOpinions`, `debateTurns`, and `AgentDebateTurn`.
- Scores the verdict from final revised `opinions`, not initial opinions.
- Includes deterministic mock chatroom turns for reliable demos.
- Includes a progressive reveal UI for chat turns while the workflow is running.

Limitations:

- Replaces the modular `main` UI with a very large `src/app/page.tsx`.
- Deletes many polished HUD components from `main`.
- The chatroom is progressive reveal, not true server streaming. It feels live, but the current implementation previews deterministic turns while waiting for the API response.

## Recommended Architecture

### Decision 1: Keep `main` as the base

Use `main` as the integration branch and preserve the current folder structure:

- `src/app/page.tsx`
- `src/app/_components/ai-jury.tsx`
- `src/app/_components/hud/*`
- `src/app/_components/ui.tsx`
- `src/app/_lib/workspace.ts`

### Decision 2: Move chatroom UI into `src/app/_components/ai-jury.tsx`

Do not copy the giant `AI-Discuss` page structure. Instead, add a modular `AgentChatroomPanel` or `AgentDebateRoom` export next to `DeliberationPanel`, `JuryPanel`, `RouteAuditPanel`, and `SimilarPastCases`.

`JuryPanel` can either be replaced by the chatroom or kept temporarily behind a smaller "Final juror records" section. The cleaner product direction is to let the chatroom replace `JuryPanel`, because the chatroom already contains expandable opinion records.

### Decision 3: Extend the jury result contract

Adopt the `AI-Discuss` data shape:

```typescript
{
  initialOpinions: AgentOpinion[];
  debateTurns: AgentDebateTurn[];
  opinions: AgentOpinion[];
  deliberation: string;
  verdict: FinalVerdict;
  mode: "mock" | "live";
}
```

Meaning:

- `initialOpinions`: first-round agent opinions before debate.
- `debateTurns`: visible transcript containing opening, revision, and consensus turns.
- `opinions`: final revised opinions used for scoring.

Scoring should stay:

\[
\text{verdict} = \text{buildVerdict(caseInput, finalOpinions)}
\]

### Decision 4: Use progressive reveal first, true streaming later

For the hackathon experience, the fastest reliable version is the `AI-Discuss` progressive reveal approach:

- Build a deterministic preview jury on the client.
- Reveal debate turns every `DEBATE_TURN_REVEAL_INTERVAL_MS`.
- Swap to the server result when the API completes.

This creates the "agents are spawning chats" experience without rewriting the API into Server-Sent Events or streaming responses.

A later enhancement can stream real model turns from the server, but that is a bigger architectural step.

## Target UI Behavior

### AI Jury tab while workflow is running

Render order:

1. `WorkflowProgress`
2. `AgentChatroomPanel`
3. Right rail with audit and similar cases can stay pending or muted.

Behavior:

- `DeliberationPanel` should not appear above the chatroom while the workflow is still running.
- The chatroom should show progressive turns if the selected route requires jury.
- For standard automation, show the existing empty state: "Standard automation bypassed jury."
- The chatroom header should clearly say it is observer-only, not a user chat input.

### AI Jury tab after workflow is ready

Render order:

1. `WorkflowProgress`
2. `DeliberationPanel`
3. `AgentChatroomPanel`
4. Right rail with `RouteAuditPanel` and `SimilarPastCases`

Behavior:

- `DeliberationPanel` is first because the reviewer now needs the final judgment.
- `AgentChatroomPanel` remains visible below as traceability.
- The final consensus strip inside the chatroom should only appear once the consensus turn is visible or the final result exists.
- The transcript should retain evidence aliases such as `B1`, `S1`, `L1`, `P1`, and `H1`.

### Stale output behavior

When intake or evidence changes:

- Hide final deliberation and final chatroom result.
- Show existing stale-state messaging.
- Do not show old agent turns as if they are current.

## Implementation Tasks

### Phase 1: Data Contract Foundation

#### Task 1: Add debate turn types

**Description:** Bring the `AgentDebateTurn` schema and `agentDebateTurnSchema` from `AI-Discuss` into `src/types/jury.ts`, then extend `juryRunResultSchema`.

**Acceptance criteria:**

- [ ] `JuryRunResult` includes `initialOpinions`, `debateTurns`, `opinions`, `deliberation`, `verdict`, and `mode`.
- [ ] Existing route and audit types still compile.
- [ ] Standard automation can still return `jury: null`.

**Verification:**

- [ ] `npm test`
- [ ] `npm run build`

**Dependencies:** None

**Files likely touched:**

- `src/types/jury.ts`

**Estimated scope:** Small

#### Task 2: Add shared deliberation helpers

**Description:** Add `src/lib/jury/deliberation.ts` and `src/lib/jury/timing.ts` from `AI-Discuss`, keeping the message cap and reveal timing centralized.

**Acceptance criteria:**

- [ ] Helpers can build opening, revision, and consensus turns.
- [ ] Agent message count is capped by `MAX_DEBATE_MESSAGES_PER_AGENT`.
- [ ] Timing constant is imported from one place.

**Verification:**

- [ ] Unit tests for non-empty debate turns.
- [ ] Unit test that consensus is the final turn.

**Dependencies:** Task 1

**Files likely touched:**

- `src/lib/jury/deliberation.ts`
- `src/lib/jury/timing.ts`
- `src/lib/jury/scoring.test.ts`

**Estimated scope:** Small

### Phase 2: Jury Execution

#### Task 3: Update mock jury to produce two-round debate

**Description:** Update `runMockJury` so it returns `initialOpinions`, final revised `opinions`, `debateTurns`, and a deliberation summary.

**Acceptance criteria:**

- [ ] Demo cases still produce stable final verdicts.
- [ ] At least one demo case shows a visible stance change.
- [ ] `buildVerdict` uses final `opinions`, not `initialOpinions`.

**Verification:**

- [ ] `npm test`
- [ ] Snapshot/manual check of one wrong-item case and one human-review case.

**Dependencies:** Tasks 1 and 2

**Files likely touched:**

- `src/lib/jury/mock.ts`
- `src/lib/jury/scoring.test.ts`

**Estimated scope:** Medium

#### Task 4: Update live jury to return panel debate

**Description:** Port the `AI-Discuss` live panel behavior into `src/lib/jury/openai.ts`, keeping one structured model call for speed and distinct agent identities for presentation.

**Acceptance criteria:**

- [ ] Live mode returns one opening opinion and one final opinion per agent.
- [ ] Live mode returns one second-round debate message per agent.
- [ ] Reply targets are sanitized so agents cannot reply to themselves or unknown IDs.
- [ ] Prompt instructions treat buyer and seller text as untrusted evidence.

**Verification:**

- [ ] `npm test`
- [ ] Manual live run if `OPENAI_API_KEY` is available.
- [ ] Mock fallback still works if live execution fails.

**Dependencies:** Tasks 1 and 2

**Files likely touched:**

- `src/lib/jury/openai.ts`
- `src/lib/jury/workflow.ts`
- `src/lib/jury/workflow.test.ts`

**Estimated scope:** Medium

### Phase 3: AI Jury Page UI

#### Task 5: Add modular `AgentChatroomPanel`

**Description:** Move the useful `AI-Discuss` chatroom UI into `src/app/_components/ai-jury.tsx` as a reusable component that matches `main` styling.

**Acceptance criteria:**

- [ ] Chatroom displays opening split, final split, vote changes, and transcript turns.
- [ ] Each turn shows agent initials, vote, phase, confidence, stance change, evidence aliases, reply targets, and expandable opinion record.
- [ ] Standard automation shows a non-jury empty state.
- [ ] The component does not introduce nested card clutter or break `main`'s dense reviewer layout.

**Verification:**

- [ ] Manual browser check on desktop and mobile widths.
- [ ] `npm run build`

**Dependencies:** Tasks 1 and 2

**Files likely touched:**

- `src/app/_components/ai-jury.tsx`
- `src/app/_lib/workspace.ts`

**Estimated scope:** Medium

#### Task 6: Add progressive chatroom state to `main` page

**Description:** Add the progressive preview state from `AI-Discuss` to `src/app/page.tsx`, but keep `main`'s existing layout and tab model.

**Acceptance criteria:**

- [ ] During `isRunning`, AI Jury tab can show a progressive chatroom preview.
- [ ] Once the API result arrives, preview state clears and final server result takes over.
- [ ] On error, preview state clears and stale turns are not displayed.
- [ ] Existing `hasUnrunChanges` behavior still hides computed output.

**Verification:**

- [ ] Run workflow from initial page load.
- [ ] Edit intake and confirm stale output behavior.
- [ ] Trigger run again and confirm progressive chatroom resumes.

**Dependencies:** Tasks 3 and 5

**Files likely touched:**

- `src/app/page.tsx`
- `src/app/_components/ai-jury.tsx`

**Estimated scope:** Medium

#### Task 7: Reorder AI Jury tab by runtime state

**Description:** Implement the desired order switch:

- Running: `AgentChatroomPanel`
- Ready: `DeliberationPanel`, then `AgentChatroomPanel`

**Acceptance criteria:**

- [ ] During thinking time, `Agent Chatroom` is the first major AI Jury section after progress.
- [ ] At ready time, `Deliberation` appears above `Agent Chatroom`.
- [ ] Right-side audit rail remains available after completion.
- [ ] Standard automation still bypasses jury cleanly.

**Verification:**

- [ ] Manual browser check for running, ready, stale, and standard automation states.
- [ ] `npm test`
- [ ] `npm run build`

**Dependencies:** Tasks 5 and 6

**Files likely touched:**

- `src/app/page.tsx`

**Estimated scope:** Small

### Phase 4: Tests and Polish

#### Task 8: Preserve and expand test coverage

**Description:** Bring over the relevant `AI-Discuss` tests and adapt them to `main`.

**Acceptance criteria:**

- [ ] Tests assert standard automation has no jury.
- [ ] Tests assert jury routes include `initialOpinions` and `debateTurns`.
- [ ] Tests assert final verdict scoring uses final opinions.
- [ ] Tests assert per-agent debate messages stay within the cap.

**Verification:**

- [ ] `npm test`

**Dependencies:** Tasks 1 through 4

**Files likely touched:**

- `src/lib/jury/scoring.test.ts`
- `src/lib/jury/workflow.test.ts`

**Estimated scope:** Small

#### Task 9: Browser verification pass

**Description:** Run the app and verify the AI Jury tab visually across important states.

**Acceptance criteria:**

- [ ] Running state shows chatroom first.
- [ ] Ready state shows deliberation first, chatroom second.
- [ ] Text does not overflow chat bubbles or buttons.
- [ ] Mobile layout remains readable.
- [ ] No old stale output appears after edits.

**Verification:**

- [ ] `npm run dev`
- [ ] Browser check on desktop viewport.
- [ ] Browser check on mobile viewport.

**Dependencies:** Tasks 5 through 7

**Files likely touched:** None expected beyond implementation fixes

**Estimated scope:** Small

## Checkpoints

### Checkpoint 1: Data Contract Works

After Tasks 1 and 2:

- [ ] TypeScript compiles.
- [ ] New debate helpers are tested.
- [ ] No UI behavior has changed yet.

### Checkpoint 2: Jury Engine Works

After Tasks 3 and 4:

- [ ] Mock jury produces two-round debate.
- [ ] Live jury contract matches mock jury contract.
- [ ] Workflow tests pass.

### Checkpoint 3: AI Jury Page Works

After Tasks 5, 6, and 7:

- [ ] AI Jury tab shows the new runtime ordering.
- [ ] Existing `main` HUD and Human Review tabs are intact.
- [ ] Export and audit still use the final result.

### Checkpoint 4: Ready to Demo

After Tasks 8 and 9:

- [ ] Tests pass.
- [ ] Build passes.
- [ ] Browser verification passes.
- [ ] Demo cases clearly show the chatroom value.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Blind merge from `AI-Discuss` deletes `main` UX work | High | Do not merge wholesale. Cherry-pick concepts and files only. |
| Progressive preview differs from final live result | Medium | Label the running state as a reveal/processing preview. Replace it immediately with server result. |
| Data contract change breaks older UI helpers | Medium | Update `JuryRunResult` consumers in one pass and keep `opinions` as final opinions. |
| Chatroom makes page too visually heavy | Medium | Keep compact bubbles, evidence chips, and expandable opinion records. Let `DeliberationPanel` stay the final summary. |
| True streaming is attempted too early | Medium | Ship progressive reveal first. Consider SSE streaming only after the core integration is stable. |
| Standard automation shows irrelevant chat UI | Low | Preserve the existing "Standard automation bypassed jury" empty state. |

## Open Questions

- Should the app auto-switch to the AI Jury tab when a workflow starts, or only show the chatroom if the reviewer is already on that tab?
- Should the old `JuryPanel` be removed entirely, or kept as a collapsed final juror record section for comparison?
- Should running chatroom copy say "previewing juror debate" to avoid implying true server streaming?
- Should we later implement true streaming with Server-Sent Events after the hackathon demo is stable?

## Recommended Next Step

Start with Tasks 1 through 3. That builds the foundation without disturbing the polished `main` UI. Once the data contract is stable and tests pass, add the modular chatroom panel and then wire the runtime ordering into the AI Jury tab.
