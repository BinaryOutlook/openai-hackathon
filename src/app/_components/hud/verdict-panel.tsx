import { AlertTriangle, BadgeCheck } from "lucide-react";
import type { JuryCaseInput, WorkflowResult } from "@/types/jury";
import {
  EmptyState,
  MarkdownText,
  MetricBar,
  PendingComputedSection,
  ReadOnlyMetric
} from "../ui";
import {
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
    <section className="rounded-md border border-line bg-white p-4 shadow-soft xl:max-h-[max(24rem,calc(100vh-32rem))] xl:overflow-y-auto">
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
        <div className="mt-4 grid gap-3">
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
        <div className="mt-4 grid gap-3">
          <div className="rounded-md bg-ink p-3 text-white">
            <p className="text-xs font-semibold uppercase text-[#fdb098]">Current recommendation</p>
            <p className="mt-2 text-xl font-medium leading-tight">{verdict.decision}</p>
            <p className="mt-2 text-sm text-[#ffebe6]">{verdict.refundType}</p>
          </div>

          <ReadOnlyMetric label="Required human action" value={getRequiredHumanAction(result, caseInput, false, false)} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <MetricBar
              label="Overall confidence"
              value={verdict.overallConfidence}
              tone={verdict.overallConfidence >= 0.75 ? "teal" : "amber"}
            />
            <MetricBar label="Risk score" value={verdict.riskScore} tone={verdict.riskScore >= 0.7 ? "coral" : "cedar"} />
          </div>

          {result?.route.routeKind === "provisional_ai_decision" ? (
            <ReadOnlyMetric
              label="Cooldown"
              value={cooldownRemaining > 0 ? `${cooldownRemaining}s remaining` : "AI decision final"}
            />
          ) : null}

          <CompactTable
            title="Vote split"
            rows={[
              ["Buyer", verdict.voteSummary.support_buyer ?? 0],
              ["Seller", verdict.voteSummary.support_seller ?? 0],
              ["More evidence", verdict.voteSummary.need_more_evidence ?? 0],
              ["Escalate", verdict.voteSummary.escalate ?? 0]
            ]}
          />

          <CompactRiskPanel result={result} />

          <CompactTable
            title="Responsibility"
            rows={Object.entries(verdict.responsibility).map(([party, value]) => [party, `${value}%`])}
          />

          <details className="rounded-md border border-line bg-[#f5f5f5]">
            <summary className="flex min-h-11 cursor-pointer items-center px-3 text-xs font-semibold uppercase text-teal">
              Decision brief
            </summary>
            <div className="border-t border-line px-3 pb-3">
              <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={verdict.rationale} />
            </div>
          </details>
        </div>
      ) : (
        <EmptyState label="Awaiting workflow" />
      )}
    </section>
  );
}

function CompactTable({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
      <h3 className="text-xs font-semibold uppercase text-teal">{title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5">
            <span className="capitalize text-graphite">{label}</span>
            <span className="font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactRiskPanel({ result }: { result: WorkflowResult | null }) {
  const items = Array.from(
    new Set([
      ...(result?.route.warnings ?? []),
      ...(result?.jury?.verdict.escalationReasons ?? []),
      ...(result?.route.indicators ?? [])
    ].filter(Boolean))
  ).slice(0, 3);

  return (
    <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
      <h3 className="text-xs font-semibold uppercase text-teal">Why risky</h3>
      {items.length ? (
        <ul className="mt-2 grid gap-1.5 text-sm leading-5 text-graphite">
          {items.map((item) => (
            <li key={item} className="[overflow-wrap:anywhere]">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-5 text-graphite">No hard risk warning on the current recommendation.</p>
      )}
    </div>
  );
}
