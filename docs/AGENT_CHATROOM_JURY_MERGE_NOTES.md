# Agent Chatroom Jury Merge Notes

## Status

Implemented on `main` on 2026-06-06.

This note documents the agent chatroom jury redesign so future merge conflicts can be resolved without re-discovering the intent of each change.

## Product Intent

The old UI showed each jury agent as an independent opinion card. The new behavior keeps the same Shrimp reviewer workflow, but changes the jury presentation and execution model:

- Agents first produce independent opening opinions.
- Agents then read the other opening opinions and revise, rebut, or hold their position.
- The final/revised opinions are the only opinions used by verdict scoring.
- The reviewer sees an observer-only debate transcript, not a user chat input.
- Standard automation still bypasses the jury and should not show the chatroom.

Keep the existing Shrimp UI character: dense operations layout, white/charcoal surfaces, restrained Shrimp Orange, compact cards, evidence aliases, stale-output handling, export, human review, provisional cooldown, and normal route behavior.

## Changed Files

| File | Change | Merge guidance |
| --- | --- | --- |
| `src/types/jury.ts` | Added `agentDebateTurnSchema`, `AgentDebateTurn`, and required `initialOpinions` / `debateTurns` fields on `juryRunResultSchema`. | Preserve `opinions` as the final/revised opinions. Do not make `initialOpinions` replace `opinions`; both are intentionally present. |
| `src/lib/jury/deliberation.ts` | New helper for opening turns, mock challenge turns, revision turns, consensus turn, and stance-change labels. | Keep this file as shared transcript-building logic for mock and live paths. If another branch duplicated this logic in `mock.ts` or `openai.ts`, prefer centralizing here. |
| `src/lib/jury/timing.ts` | Shared chatroom constants for max two messages per agent and 750ms progressive turn reveal. | Keep message-count and reveal values centralized here. Do not reintroduce scattered timing caps in page, workflow, or tests. |
| `src/lib/jury/mock.ts` | Mock jury now builds `initialOpinions`, revised final `opinions`, deterministic debate turns, and a deliberation summary that mentions debate turns and vote changes. | Final verdicts are intentionally based on final `opinions`, not `initialOpinions`. Preserve deterministic revisions for demo stability. |
| `src/lib/jury/openai.ts` | Live jury now uses one structured panel call that returns all opening opinions, second chat replies/conclusions, and deliberation summary. | Preserve the batched panel path unless product explicitly requires separate per-agent live calls again. The panel must still return distinct agent identities. |
| `src/lib/jury/workflow.ts` | Runs the selected jury runner after standard automation has already bypassed jury. | Keep standard automation before jury execution. Do not add direct OpenAI calls here. |
| `src/app/page.tsx` | Replaced the old opinion-card grid with an `Agent Chatroom`; added progressive debate preview while running and alternating chat bubbles. | In conflicts, keep `AgentDebateRoom` where the old `JuryPanel` was rendered. Preserve `progressiveJury`, `visibleDebateTurnCount`, chat bubble alignment, and max-two-message copy. |
| `src/lib/jury/scoring.test.ts` | Added coverage for schema parsing, non-empty debate transcript, challenge/revision/consensus turns, and final-opinion scoring. | If scoring changes, keep a test that proves `verdict.voteSummary` comes from final `opinions`. |
| `src/lib/jury/workflow.test.ts` | Added assertions that standard automation has no jury/provisional/human context, human review still includes two-round jury context, and debate turns stay within the two-message cap. | Preserve the standard automation bypass assertion and the message-cap assertion. |
| `vitest.config.ts` | Fixed Windows alias resolution for `@/` imports by resolving the local `src` path through `fileURLToPath` and `resolve`. | Keep this Windows-safe alias. Reverting to `new URL("./src", import.meta.url).pathname` breaks Vitest on this host. |

## Data Contract

`JuryRunResult` now has this important shape:

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

- `initialOpinions`: first-round independent agent positions.
- `debateTurns`: chatroom transcript including opening, challenge, revision, and consensus turns.
- `opinions`: final/revised positions used by `buildVerdict`.

Do not score from `initialOpinions`. The scoring contract is:

```typescript
const verdict = buildVerdict(caseInput, finalOpinions);
```

## Debate Turn Contract

Each `AgentDebateTurn` includes:

- `id`
- `phase`: `opening`, `challenge`, `revision`, or `consensus`
- `agentId`
- `agentName`
- `message`
- `vote`
- `confidence`
- `citedEvidenceIds`
- `replyToAgentIds`
- `stanceChange`: `held`, `softened`, `strengthened`, `changed`, or `consensus`

The UI depends on these fields for avatar initials, phase pills, vote pills, evidence chips, reply labels, and stance-shift copy.

## Mock Flow

`runMockJury` now:

1. Builds deterministic `initialOpinions`.
2. Builds deterministic final `opinions`.
3. Calls `buildVerdict(caseInput, opinions)`.
4. Builds debate turns with `buildMockDebateTurns`.
5. Returns both opening and final opinion sets.

Some demo cases intentionally revise one agent's vote to prove the second-round contract:

- Wrong item: `packaging-logistics` opens as `need_more_evidence`, then revises to `support_buyer`.
- Damaged delivery: `fraud-risk` opens as `need_more_evidence`, then uses the final profile.
- Ambiguous quality: `buyer-advocate` opens as `support_buyer`, then uses the final profile.
- Opened cosmetics / prompt injection: `buyer-advocate` opens as `need_more_evidence`, then uses the final profile.

These revisions are designed to keep existing final verdict behavior stable while making debate visible.

## Live Flow

`runLiveJury` now:

1. Calls every agent once for initial opinions.
2. Calls every agent again through `runAgentRevision`.
3. Gives each agent its own initial opinion plus condensed opposing views.
4. Parses the revision response into `{ opinion, debateMessage, replyToAgentIds }`.
5. Sanitizes reply targets so an agent cannot reply to itself or unknown IDs.
6. Uses revised opinions for the verdict.
7. Asks the foreperson to summarize the two-round deliberation.

Live mode is optimized as one structured panel call instead of many per-agent calls. The returned transcript still represents separate juror personas, but the model call count is kept small for reviewer speed.

Do not merge a change that returns the UI to independent opinion cards. If live mode is changed back to separate per-agent calls, re-check runtime carefully.

## Chatroom Message Contract

The shared chatroom source of truth is `src/lib/jury/timing.ts`:

```typescript
export const MAX_DEBATE_MESSAGES_PER_AGENT = 2;
export const DEBATE_TURN_REVEAL_INTERVAL_MS = 750;
```

Runtime behavior:

- Each non-foreperson agent gets at most two transcript messages before consensus.
- Message one is the opening position.
- Message two is the reply/conclusion after reading other jurors.
- The foreperson consensus is allowed as the final room-level message and does not count against an individual agent cap.
- Progressive debate reveals turns every 750ms from a deterministic preview, then swaps to the final server result when it arrives.
- UI freshness copy references the message cap, not a timer.

## UI Replacement Details

The old `JuryPanel` rendered a grid of opinion cards. It has been replaced by `AgentDebateRoom`.

Keep these pieces together in conflicts:

- `AgentDebateRoom`
- `DebateTurnBubble`
- `FinalConsensusStrip`
- `getTurnOpinion`
- `getAgentInitials`
- `getTurnToneClass`
- `getPhaseLabel`
- `getPhaseStyle`
- `getStanceChangeLabel`
- `formatVoteSplitFromOpinions`

The chatroom should show:

- Opening positions metric.
- Final split metric.
- Vote changes metric.
- Scrollable transcript with `role="log"`.
- Agent avatar initials.
- Vote pill and phase pill.
- Confidence and stance-change text.
- Evidence chips using existing evidence aliases.
- Reply targets.
- Expandable opinion record.
- Final consensus strip with decision, refund type, confidence, evidence, rationale, and recommended actions.
- While running, `Revealing X/Y turns` and only the currently visible subset of `debateTurns`.
- The consensus strip only once the consensus turn is visible or the final result has arrived.

The right-side traceability rail should still show:

- Deliberation timeline.
- Disagreement inspector.
- Similar past cases.
- Recommended actions.

`AgentInteractionFramework` was removed because the chatroom now carries interaction detail directly.

## Route Behavior to Preserve

Standard automation remains a non-jury path:

- `WorkflowResult.jury` should be `null`.
- The chatroom should show the empty state "Standard automation bypassed jury".
- Export and audit behavior should continue to work.

Human review and provisional decision behavior should remain unchanged except that the jury context now includes the debate transcript.

## Common Conflict Resolutions

### Conflict in `src/types/jury.ts`

Keep any newer fields from both sides, but ensure `juryRunResultSchema` includes:

```typescript
initialOpinions: z.array(agentOpinionSchema),
debateTurns: z.array(agentDebateTurnSchema),
opinions: z.array(agentOpinionSchema),
```

Also keep `AgentDebateTurn` exported.

### Conflict in `src/lib/jury/mock.ts`

Prefer this order inside `runMockJury`:

```typescript
const initialOpinions = ...
const opinions = ...
const verdict = buildVerdict(caseInput, opinions);
const debateTurns = buildMockDebateTurns(caseInput, initialOpinions, opinions, verdict);
```

If another branch added more demo-case profiles, merge those into `getMockProfile` / `getInitialMockProfile` without removing the initial-vs-final distinction.

### Conflict in `src/lib/jury/openai.ts`

Keep both:

- `runAgent` for independent openings.
- `runAgentRevision` for second-round revisions.

The return value should include:

```typescript
initialOpinions: opinions,
debateTurns: [
  ...buildOpeningTurns(opinions),
  ...revisions.map((revision) => revision.turn),
  buildConsensusTurn(verdict, finalOpinions)
],
opinions: finalOpinions,
```

### Conflict in `src/app/page.tsx`

If a conflict shows old `JuryPanel` and new `AgentDebateRoom`, keep `AgentDebateRoom`.

The render site should pass the full jury result:

```tsx
<AgentDebateRoom
  result={displayedJury}
  isRunning={isRunning}
  isPreview={isRunning && Boolean(progressiveJury)}
  routeKind={displayedRouteKind}
  evidenceAliases={evidenceAliases}
  visibleTurnCount={isRunning ? visibleDebateTurnCount : undefined}
/>
```

Do not pass only `opinions`; the chatroom needs `initialOpinions`, `debateTurns`, and `verdict`. Do not remove the progressive preview state unless the API is replaced with true server streaming.

### Conflict in `src/lib/jury/timing.ts`

Keep the production message cap at two messages per agent:

```typescript
MAX_DEBATE_MESSAGES_PER_AGENT = 2
```

Do not increase this cap unless the product explicitly wants longer juror conversations.

### Conflict in Tests

Keep tests that verify:

- `juryRunResultSchema` parses the new fields.
- Mock disputed cases produce debate turns.
- Standard automation bypasses the jury.
- Existing demo final verdicts remain stable.
- Final/revised opinions drive scoring.
- Every non-consensus agent stays at or below the configured message cap.

## Verification Already Run

Commands completed successfully after implementation:

```powershell
npm.cmd test
npm.cmd run build
```

Additional verification after the max-two-message change:

```powershell
npm.cmd test -- src/lib/jury/workflow.test.ts
```

Measured result on this Windows workspace:

- Full suite: 19 tests passed, Vitest duration 1.25s after the max-two-message change.
- Clean-port smoke check on `http://127.0.0.1:3001`: rendered `Agent Chatroom`, did not render old `Jury Panel`.
- Message-cap regression: max two messages per non-consensus agent; consensus remains the final room message.
- Production discussion limit: max two messages per agent before consensus.

Browser verification was also performed against temporary local Next servers:

- Demo cases checked: wrong item, damaged delivery, opened cosmetics, ambiguous quality, uncontested return.
- States checked: loading, stale edits, human review, provisional cooldown, export JSON, standard automation bypass.
- Responsive widths checked: 320, 768, 1024, 1440.
- No console errors were observed during the completed browser run.
- No horizontal overflow was detected at the checked responsive widths.
- The final consensus strip was verified after allowing the workflow to finish rendering.

## Known Local Dev Server Note

This Windows managed shell had trouble keeping `npm run dev` alive as a hidden background process because PowerShell saw duplicate `Path` / `PATH` environment keys. Foreground dev mode works:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Use that command when manually checking future conflict resolutions.

## Post-Merge Checklist

After resolving any future merge conflicts, run:

```powershell
npm.cmd test
npm.cmd run build
```

Then manually verify:

- Disputed demo cases show `Agent Debate Room`.
- During a run, debate turns appear sequentially instead of all at once.
- Freshness copy references the max-two-message chatroom rule.
- Standard automation says `Standard automation bypassed jury`.
- The final consensus strip appears after the workflow completes.
- Export JSON includes route and jury data when a jury ran.
- No text overlap appears in the transcript at 320px width.
