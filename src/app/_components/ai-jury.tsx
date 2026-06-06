import { FileText, Gavel, History, Sparkles } from "lucide-react";
import type { AgentOpinion, JuryCaseInput, RouteKind, WorkflowResult } from "@/types/jury";
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
            <article key={opinion.agentId} className="rounded-md border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{opinion.agentName}</h3>
                  <p className="mt-1 text-xs text-graphite">Confidence {formatPercent(opinion.confidence)}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${voteStyles[opinion.vote]}`}>
                  {voteLabels[opinion.vote]}
                </span>
              </div>

              <ul className="mt-3 grid gap-2 text-sm leading-5 text-graphite">
                <li>Main rationale: {summarizeOpinion(opinion.reasoning)}</li>
                <li>Evidence used: {formatEvidenceList(opinion.citedEvidenceIds, evidenceAliases)}</li>
                <li>Disagreement notes: {opinion.riskFlags.join(" ") || "No material disagreement noted."}</li>
              </ul>

              <details className="mt-3 rounded-md border border-line bg-[#f5f5f5] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-teal">Full reasoning</summary>
                <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={opinion.reasoning} />
                <p className="mt-3 text-sm font-medium text-ink">{opinion.recommendation}</p>
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
          <DisagreementInspector result={result} evidenceAliases={evidenceAliases} />
          <AgentInteractionFramework result={result} />
          <div>
            <h3 className="text-sm font-semibold">Recommended Actions</h3>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-graphite">
              {result.verdict.recommendedActions.map((action) => (
                <li key={action} className="rounded-md border border-line bg-[#f5f5f5] px-3 py-2">
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
            <p className="text-xs font-semibold uppercase text-teal">Rationale</p>
            <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={result.verdict.rationale} />
          </div>
          <SimilarPastCases caseInput={caseInput} />
        </div>
      ) : (
        <EmptyState label={routeKind === "standard_automation" ? "No jury deliberation required" : "Awaiting deliberation"} />
      )}
    </section>
  );
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
    <div className="rounded-md border border-line bg-white p-3">
      <h3 className="text-sm font-semibold">Disagreement Inspector</h3>
      <div className="mt-3 grid gap-2">
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
    </div>
  );
}

function AgentInteractionFramework({ result }: { result: NonNullable<WorkflowResult["jury"]> }) {
  const split = formatVoteSplit(result.verdict.voteSummary);
  const riskFlags = Array.from(new Set(result.opinions.flatMap((opinion) => opinion.riskFlags))).slice(0, 3);

  return (
    <div className="rounded-md border border-line bg-white p-3">
      <h3 className="text-sm font-semibold">Agent Interaction</h3>
      <div className="mt-3 grid gap-2">
        <ReadOnlyMetric label="Initial positions" value={split} />
        <ReadOnlyMetric label="Challenge points" value={riskFlags.join(" ") || "No blocking challenge points."} />
        <ReadOnlyMetric label="Final recommendation" value={result.verdict.decision} />
      </div>
    </div>
  );
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
