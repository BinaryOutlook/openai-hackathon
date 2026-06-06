import { AlertTriangle, BadgeCheck } from "lucide-react";
import type { AgentVote, JuryCaseInput, WorkflowResult } from "@/types/jury";
import {
  EmptyState,
  MarkdownText,
  MetricBar,
  PendingComputedSection,
  ReadOnlyMetric,
  RiskPanel,
  VoteRow
} from "../ui";
import {
  formatEvidenceList,
  getRequiredHumanAction,
  getStandardAutomationDecision,
  type EvidenceAliases
} from "../../_lib/workspace";

export function VerdictPanel({
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
  const isStandardAutomation = result?.route.routeKind === "standard_automation";
  const standardDecision = getStandardAutomationDecision(caseInput);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{isStandardAutomation ? "Automation" : "Verdict Workspace"}</h2>
        {result?.route.routeKind === "human_review" || verdict?.escalate ? (
          <AlertTriangle className="h-5 w-5 text-coral" aria-hidden="true" />
        ) : (
          <BadgeCheck className="h-5 w-5 text-teal" aria-hidden="true" />
        )}
      </div>

      {isRunning || hasUnrunChanges ? (
        <PendingComputedSection isRunning={isRunning} hasUnrunChanges={hasUnrunChanges} />
      ) : isStandardAutomation && result ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-ink p-4 text-white">
            <p className="text-xs font-semibold uppercase text-[#fdb098]">Decision</p>
            <p className="mt-2 text-2xl font-medium leading-tight">{standardDecision.title}</p>
            <p className="mt-2 text-sm text-[#ffebe6]">{standardDecision.clause}</p>
          </div>
          <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
            <p className="text-xs font-semibold uppercase text-teal">Routing reason</p>
            <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={result.route.routingReason} />
          </div>
          <ReadOnlyMetric
            label="Evidence IDs"
            value={result.audit.evidenceIds.map((id) => evidenceAliases[id] ?? id).join(", ")}
          />
        </div>
      ) : verdict ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-ink p-4 text-white">
            <p className="text-xs font-semibold uppercase text-[#fdb098]">Current recommendation</p>
            <p className="mt-2 text-2xl font-medium leading-tight">{verdict.decision}</p>
            <p className="mt-2 text-sm text-[#ffebe6]">{verdict.refundType}</p>
          </div>

          <ReadOnlyMetric label="Required human action" value={getRequiredHumanAction(result, caseInput, false, false)} />
          <MetricBar
            label="Overall confidence"
            value={verdict.overallConfidence}
            tone={verdict.overallConfidence >= 0.75 ? "teal" : "amber"}
          />
          <MetricBar label="Risk score" value={verdict.riskScore} tone={verdict.riskScore >= 0.7 ? "coral" : "cedar"} />

          {result?.route.routeKind === "provisional_ai_decision" ? (
            <ReadOnlyMetric
              label="Cooldown"
              value={cooldownRemaining > 0 ? `${cooldownRemaining}s remaining` : "AI decision final"}
            />
          ) : null}

          <div>
            <h3 className="text-sm font-semibold">Vote Split</h3>
            <div className="mt-2 grid gap-2">
              {Object.entries(verdict.voteSummary).map(([vote, count]) => (
                <VoteRow key={vote} vote={vote as AgentVote} count={count} total={result?.jury?.opinions.length ?? 7} />
              ))}
            </div>
          </div>

          <RiskPanel result={result} />

          <div>
            <h3 className="text-sm font-semibold">Responsibility</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Object.entries(verdict.responsibility).map(([party, value]) => (
                <ReadOnlyMetric key={party} label={party} value={`${value}%`} />
              ))}
            </div>
          </div>

          <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
            <p className="text-xs font-semibold uppercase text-teal">Decision brief</p>
            <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={verdict.rationale} />
          </div>
        </div>
      ) : (
        <EmptyState label="Awaiting workflow" />
      )}
    </section>
  );
}
