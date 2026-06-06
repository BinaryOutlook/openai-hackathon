import { FileText, Gavel, History, MessageSquare, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { MAX_DEBATE_MESSAGES_PER_AGENT } from "@/lib/jury/timing";
import type { AgentDebateTurn, AgentOpinion, AgentVote, JuryCaseInput, RouteKind, WorkflowResult } from "@/types/jury";
import {
  EmptyState,
  MarkdownText,
  MetricBar,
  PendingComputedSection,
  ReadOnlyMetric,
  ReviewList,
  RiskPanel
} from "./ui";
import {
  aliasEvidenceReferences,
  buildDisagreementGroups,
  formatEvidenceList,
  formatPercent,
  formatVoteSplit,
  getSimilarPastCases,
  getSystemRecommendation,
  requestReasonLabels,
  routeLabels,
  summarizeOpinion,
  uniqueText,
  voteLabels,
  voteStyles,
  type EvidenceAliases
} from "../_lib/workspace";

// AUDIT_NOTE: This panel puts route, recommendation, evidence IDs, confidence, risk, cooldown, and warnings in one scan path.
export function RouteAuditPanel({
  caseInput,
  result,
  isRunning,
  hasUnrunChanges,
  cooldownRemaining,
  evidenceAliases
}: {
  caseInput: JuryCaseInput;
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  cooldownRemaining: number;
  evidenceAliases: EvidenceAliases;
}) {
  const verdict = result?.provisionalDecision?.verdict ?? result?.jury?.verdict;
  const evidenceIds = result?.audit.evidenceIds ?? [];
  const warnings = uniqueText([
    ...(result?.route.warnings ?? []),
    ...(result?.jury?.verdict.escalationReasons ?? [])
  ]);
  const indicators = result?.route.indicators ?? [];

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Audit Trace</h2>
          <p className="mt-1 text-xs text-graphite">{caseInput.id}</p>
        </div>
        <FileText className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      {isRunning || hasUnrunChanges ? (
        <PendingComputedSection isRunning={isRunning} hasUnrunChanges={hasUnrunChanges} />
      ) : result ? (
        <div className="mt-4 grid gap-3">
          <ReadOnlyMetric label="Route" value={routeLabels[result.route.routeKind]} />
          <ReadOnlyMetric label="Recommendation" value={getSystemRecommendation(result, caseInput)} />
          <ReadOnlyMetric label="Final audit decision" value={result.audit.finalDecision} />
          <ReadOnlyMetric
            label="Evidence IDs"
            value={evidenceIds.length ? evidenceIds.map((id) => evidenceAliases[id] ?? id).join(", ") : "No cited evidence"}
          />
          {verdict ? (
            <>
              <MetricBar
                label="Overall confidence"
                value={verdict.overallConfidence}
                tone={verdict.overallConfidence >= 0.75 ? "teal" : "amber"}
              />
              <MetricBar
                label="Risk score"
                value={verdict.riskScore}
                tone={verdict.riskScore >= 0.7 ? "coral" : "cedar"}
              />
            </>
          ) : null}
          {result.route.routeKind === "provisional_ai_decision" ? (
            <ReadOnlyMetric
              label="Cooldown"
              value={cooldownRemaining > 0 ? `${cooldownRemaining}s remaining` : "AI decision final"}
            />
          ) : null}
          <RiskPanel result={result} />
          <ReviewList title="Route Indicators" items={aliasEvidenceReferences(indicators, evidenceAliases)} />
          <ReviewList title="Warnings and Escalation" items={aliasEvidenceReferences(warnings, evidenceAliases)} />
        </div>
      ) : (
        <EmptyState label="Awaiting workflow audit" />
      )}
    </section>
  );
}

// UX_NOTE: Agent cards show a short decision summary first and tuck full reasoning into details for fast judge scanning.
export function JuryPanel({
  opinions,
  isRunning,
  routeKind,
  evidenceAliases
}: {
  opinions: AgentOpinion[];
  isRunning: boolean;
  routeKind?: RouteKind;
  evidenceAliases: EvidenceAliases;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Jury Panel</h2>
        <Sparkles className="h-5 w-5 text-amber" aria-hidden="true" />
      </div>

      {opinions.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {opinions.map((opinion) => (
            <article key={opinion.agentId} className="min-w-0 rounded-md border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{opinion.agentName}</h3>
                  <p className="mt-1 text-xs text-graphite">Confidence {formatPercent(opinion.confidence)}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${voteStyles[opinion.vote]}`}>
                  {voteLabels[opinion.vote]}
                </span>
              </div>

              <p className="mt-3 text-sm leading-5 text-ink">
                <strong className="text-teal">{voteLabels[opinion.vote]}</strong> recommendation
              </p>
              <ul className="mt-2 grid gap-1.5 text-sm leading-5 text-graphite">
                {buildOpinionSummary(opinion, evidenceAliases).map((point) => (
                  <li key={point} className="[overflow-wrap:anywhere]">{point}</li>
                ))}
              </ul>

              <details className="mt-3 min-w-0 rounded-md border border-line bg-[#f5f5f5]">
                <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold text-teal">
                  Full reasoning
                </summary>
                <div className="px-3 pb-3">
                  <MarkdownText className="mt-1 text-sm leading-6 text-graphite [overflow-wrap:anywhere]" text={opinion.reasoning} />
                  <p className="mt-3 text-sm font-medium text-ink [overflow-wrap:anywhere]">{opinion.recommendation}</p>
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          label={
            isRunning
              ? "Jury running"
              : routeKind === "standard_automation"
                ? "Standard automation bypassed jury"
                : "No opinions yet"
          }
        />
      )}
    </section>
  );
}

// UX_NOTE: The chatroom visualizes opening positions, replies, and consensus so the jury feels deliberative rather than single-shot.
export function AgentChatroomPanel({
  result,
  isRunning,
  isPreview = false,
  isRevealing = false,
  routeKind,
  evidenceAliases,
  visibleTurnCount
}: {
  result: WorkflowResult["jury"];
  isRunning: boolean;
  isPreview?: boolean;
  isRevealing?: boolean;
  routeKind?: RouteKind;
  evidenceAliases: EvidenceAliases;
  visibleTurnCount?: number;
}) {
  const changedCount = result
    ? result.opinions.filter((opinion) => {
        const initial = result.initialOpinions.find((candidate) => candidate.agentId === opinion.agentId);
        return initial && initial.vote !== opinion.vote;
      }).length
    : 0;
  const visibleTurns = result
    ? result.debateTurns.slice(0, visibleTurnCount ?? result.debateTurns.length)
    : [];
  const isConsensusVisible = Boolean(
    result && visibleTurns.some((turn) => turn.phase === "consensus")
  );

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Agent Chatroom</h2>
          <p className="mt-1 text-xs text-graphite">Opening positions, reply round, consensus</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-teal/30 bg-[#fff7f4] px-2.5 py-1 text-xs font-semibold text-teal">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {result
              ? isRevealing
                ? `Revealing ${visibleTurns.length}/${result.debateTurns.length}`
                : `${result.debateTurns.length} turns`
              : "Waiting"}
          </span>
          <span className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-graphite">
            Max {MAX_DEBATE_MESSAGES_PER_AGENT} messages / agent
          </span>
        </div>
      </div>

      {result ? (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 md:grid-cols-3">
            <ReadOnlyMetric label="Opening positions" value={formatVoteSplitFromOpinions(result.initialOpinions)} />
            <ReadOnlyMetric label="Final split" value={formatVoteSplit(result.verdict.voteSummary)} />
            <ReadOnlyMetric label="Vote changes" value={`${changedCount} revised after debate`} />
          </div>
          <div
            role="log"
            aria-label="Agent debate transcript"
            className="max-h-[760px] overflow-y-auto rounded-md border border-line bg-[#f5f5f5] p-3"
          >
            <div className="grid gap-3">
              {visibleTurns.map((turn, index) => (
                <DebateTurnBubble
                  key={turn.id}
                  turn={turn}
                  index={index}
                  result={result}
                  evidenceAliases={evidenceAliases}
                />
              ))}
            </div>
          </div>
          {isConsensusVisible ? (
            <FinalConsensusStrip result={result} evidenceAliases={evidenceAliases} />
          ) : isPreview || isRevealing ? (
            <div className="rounded-md border border-amber/30 bg-[#fff3d6] p-3 text-sm leading-6 text-[#7a4d00]">
              Each juror gets at most {MAX_DEBATE_MESSAGES_PER_AGENT} messages before the room moves to consensus.
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          label={
            isRunning
              ? "Jury running"
              : routeKind === "standard_automation"
                ? "Standard automation bypassed jury"
                : "No debate yet"
          }
        />
      )}
    </section>
  );
}

function DebateTurnBubble({
  turn,
  index,
  result,
  evidenceAliases
}: {
  turn: AgentDebateTurn;
  index: number;
  result: NonNullable<WorkflowResult["jury"]>;
  evidenceAliases: EvidenceAliases;
}) {
  const opinion = getTurnOpinion(turn, result);
  const agentNameById = new Map([
    ...result.initialOpinions.map((candidate) => [candidate.agentId, candidate.agentName] as const),
    ["foreperson", "Jury Foreperson"] as const
  ]);
  const replyNames = turn.replyToAgentIds.map((agentId) => agentNameById.get(agentId) ?? agentId);
  const isConsensus = turn.phase === "consensus";
  const alignRight = !isConsensus && index % 2 === 1;
  const avatar = (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
      isConsensus
        ? "border-teal/30 bg-mint text-teal"
        : "border-line bg-white text-teal"
    }`}>
      {getAgentInitials(turn.agentName)}
    </div>
  );

  return (
    <article className={`flex w-full gap-2 ${isConsensus ? "justify-center" : alignRight ? "justify-end" : "justify-start"}`}>
      {!alignRight ? avatar : null}
      <div className={`min-w-0 max-w-[min(100%,760px)] rounded-md border px-3 py-2 shadow-sm ${getTurnToneClass(turn)}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-semibold">{turn.agentName}</h3>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${voteStyles[turn.vote]}`}>
                {voteLabels[turn.vote]}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPhaseStyle(turn.phase)}`}>
                {getPhaseLabel(turn.phase)}
              </span>
            </div>
            <p className="mt-1 text-xs text-graphite">
              Turn {index + 1} / Confidence {formatPercent(turn.confidence)} / {getStanceChangeLabel(turn.stanceChange)}
            </p>
          </div>
          <span className="rounded-md border border-line bg-white/80 px-2 py-1 text-xs font-semibold text-graphite">
            {formatEvidenceList(turn.citedEvidenceIds, evidenceAliases)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink [overflow-wrap:anywhere]">{turn.message}</p>

        {replyNames.length ? (
          <p className="mt-2 text-xs leading-5 text-graphite">Replying to {replyNames.join(", ")}</p>
        ) : null}

        {opinion ? (
          <details className="mt-3 rounded-md border border-line bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-teal">Opinion record</summary>
            <ul className="mt-2 grid gap-2 text-sm leading-5 text-graphite">
              <li>Main rationale: {summarizeOpinion(opinion.reasoning)}</li>
              <li>Disagreement notes: {opinion.riskFlags.join(" ") || "No material disagreement noted."}</li>
              <li>Recommendation: {opinion.recommendation}</li>
            </ul>
          </details>
        ) : null}
      </div>
      {alignRight ? avatar : null}
    </article>
  );
}

function FinalConsensusStrip({
  result,
  evidenceAliases
}: {
  result: NonNullable<WorkflowResult["jury"]>;
  evidenceAliases: EvidenceAliases;
}) {
  const citedEvidence = formatEvidenceList(
    Array.from(new Set(result.opinions.flatMap((opinion) => opinion.citedEvidenceIds))),
    evidenceAliases
  );

  return (
    <div className="rounded-md border border-teal/30 bg-[#fff7f4] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-teal">Final consensus</p>
          <h3 className="mt-1 text-xl font-medium leading-tight text-ink">{result.verdict.decision}</h3>
          <p className="mt-1 text-sm text-graphite">{result.verdict.refundType}</p>
        </div>
        <div className="grid min-w-40 gap-1 text-sm">
          <span className="font-semibold">Confidence {formatPercent(result.verdict.overallConfidence)}</span>
          <span className="text-graphite">Evidence {citedEvidence}</span>
        </div>
      </div>
      <MarkdownText className="mt-3 text-sm leading-6 text-graphite [overflow-wrap:anywhere]" text={result.verdict.rationale} />
      <ul className="mt-3 grid gap-2 text-sm leading-5 text-graphite md:grid-cols-2">
        {result.verdict.recommendedActions.map((action) => (
          <li key={action} className="rounded-md border border-line bg-white px-3 py-2">
            {action}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeliberationPanel({
  result,
  routeKind,
  caseInput,
  evidenceAliases
}: {
  result: WorkflowResult["jury"];
  routeKind?: RouteKind;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Deliberation</h2>
        <Gavel className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      {result ? (
        <div className="mt-4 grid gap-4">
          <DeliberationTimeline result={result} evidenceCount={caseInput.evidence.length} />
          <div className="grid gap-2 md:grid-cols-3">
            <ReadOnlyMetric label="Vote split" value={formatVoteSplit(result.verdict.voteSummary)} />
            <ReadOnlyMetric label="Recommendation" value={result.verdict.decision} />
            <ReadOnlyMetric
              label="Evidence IDs"
              value={formatEvidenceList(
                Array.from(new Set(result.opinions.flatMap((opinion) => opinion.citedEvidenceIds))),
                evidenceAliases
              )}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <MetricBar
              label="Overall confidence"
              value={result.verdict.overallConfidence}
              tone={result.verdict.overallConfidence >= 0.75 ? "teal" : "amber"}
            />
            <MetricBar label="Risk score" value={result.verdict.riskScore} tone={result.verdict.riskScore >= 0.7 ? "coral" : "cedar"} />
          </div>
          <Disclosure title="Disagreement Inspector">
            <DisagreementInspector result={result} evidenceAliases={evidenceAliases} />
          </Disclosure>
          <Disclosure title="Recommended Actions">
            <ul className="grid gap-2 text-sm leading-6 text-graphite">
              {result.verdict.recommendedActions.map((action) => (
                <li key={action} className="rounded-md border border-line bg-[#f5f5f5] px-3 py-2">
                  {action}
                </li>
              ))}
            </ul>
          </Disclosure>
          <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
            <p className="text-xs font-semibold uppercase text-teal">Rationale</p>
            <MarkdownText className="mt-2 text-sm leading-6 text-graphite [overflow-wrap:anywhere]" text={result.verdict.rationale} />
          </div>
        </div>
      ) : (
        <EmptyState label={routeKind === "standard_automation" ? "No jury deliberation required" : "Awaiting deliberation"} />
      )}
    </section>
  );
}

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-md border border-line bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold text-ink">
        {title}
      </summary>
      <div className="border-t border-line p-3">{children}</div>
    </details>
  );
}

function buildOpinionSummary(opinion: AgentOpinion, evidenceAliases: EvidenceAliases) {
  const rationale = limitWords(summarizeOpinion(opinion.reasoning), 9);
  const signal = opinion.riskFlags.length
    ? limitWords(opinion.riskFlags.join(" "), 8)
    : `Evidence ${formatEvidenceList(opinion.citedEvidenceIds, evidenceAliases)}`;

  return [`Why: ${rationale}`, `Signal: ${signal}`];
}

function limitWords(text: string, maxWords: number) {
  const words = text
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function DeliberationTimeline({
  result,
  evidenceCount
}: {
  result: NonNullable<WorkflowResult["jury"]>;
  evidenceCount: number;
}) {
  const steps = [
    { title: "Evidence", detail: `${evidenceCount} evidence items structured for review.` },
    { title: "Arguments", detail: `${result.opinions.length} jurors produced role-specific opinions.` },
    { title: "Disagreement", detail: formatVoteSplit(result.verdict.voteSummary) },
    { title: "Recommendation", detail: result.verdict.decision }
  ];

  return (
    <div className="rounded-md border border-line bg-[#fff7f4] p-3">
      <h3 className="text-sm font-semibold">Deliberation Timeline</h3>
      <ol className="mt-3 grid gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-sm leading-5 text-graphite">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DisagreementInspector({
  result,
  evidenceAliases
}: {
  result: NonNullable<WorkflowResult["jury"]>;
  evidenceAliases: EvidenceAliases;
}) {
  const groups = buildDisagreementGroups(result.opinions, evidenceAliases);

  return (
    <div className="grid gap-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-md border border-line bg-[#f5f5f5] p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{group.title}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${group.tone}`}>{group.count}</span>
            </div>
            <p className="mt-2 text-sm leading-5 text-graphite">{group.detail}</p>
          </div>
        ))}
    </div>
  );
}

function getTurnOpinion(turn: AgentDebateTurn, result: NonNullable<WorkflowResult["jury"]>) {
  if (turn.phase === "opening") {
    return result.initialOpinions.find((opinion) => opinion.agentId === turn.agentId);
  }

  if (turn.phase === "consensus") {
    return null;
  }

  return result.opinions.find((opinion) => opinion.agentId === turn.agentId);
}

function getAgentInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getTurnToneClass(turn: AgentDebateTurn) {
  if (turn.phase === "consensus") {
    return "border-teal/30 bg-[#fff7f4]";
  }

  if (turn.phase === "challenge") {
    return "border-amber/40 bg-[#fff3d6]";
  }

  if (turn.vote === "escalate") {
    return "border-coral/30 bg-[#fce8e6]";
  }

  if (turn.vote === "support_buyer") {
    return "border-teal/20 bg-[#fff7f4]";
  }

  return "border-line bg-white";
}

function getPhaseLabel(phase: AgentDebateTurn["phase"]) {
  switch (phase) {
    case "opening":
      return "Opening";
    case "challenge":
      return "Challenge";
    case "revision":
      return "Revision";
    case "consensus":
      return "Consensus";
  }
}

function getPhaseStyle(phase: AgentDebateTurn["phase"]) {
  switch (phase) {
    case "opening":
      return "bg-white text-graphite";
    case "challenge":
      return "bg-[#fff3d6] text-[#7a4d00]";
    case "revision":
      return "bg-[#ffebe6] text-teal";
    case "consensus":
      return "bg-mint text-teal";
  }
}

function getStanceChangeLabel(change: AgentDebateTurn["stanceChange"]) {
  switch (change) {
    case "changed":
      return "Changed vote";
    case "strengthened":
      return "More certain";
    case "softened":
      return "Less certain";
    case "consensus":
      return "Consensus reached";
    case "held":
      return "Held position";
  }
}

function formatVoteSplitFromOpinions(opinions: AgentOpinion[]) {
  const voteSummary = opinions.reduce<Record<AgentVote, number>>(
    (summary, opinion) => ({
      ...summary,
      [opinion.vote]: summary[opinion.vote] + 1
    }),
    {
      support_buyer: 0,
      support_seller: 0,
      need_more_evidence: 0,
      escalate: 0
    }
  );

  return formatVoteSplit(voteSummary);
}

export function SimilarPastCases({
  caseInput,
  similarCases
}: {
  caseInput: JuryCaseInput;
  similarCases?: JuryCaseInput[];
}) {
  const similar = similarCases ?? getSimilarPastCases(caseInput);

  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-teal" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Similar Past Cases</h3>
      </div>
      <div className="mt-3 grid gap-2">
        {similar.length ? (
          similar.map((demoCase) => (
            <div key={demoCase.id} className="rounded-md border border-line bg-[#f5f5f5] p-3">
              <p className="text-sm font-semibold">{demoCase.title}</p>
              <p className="mt-1 text-xs text-graphite">
                {requestReasonLabels[demoCase.requestReason]} · ${demoCase.orderValue}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-graphite">No close demo precedent for this route.</p>
        )}
      </div>
    </div>
  );
}
