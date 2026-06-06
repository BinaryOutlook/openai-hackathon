import { BadgeCheck, FileText, MessageSquare, Search, UserCheck } from "lucide-react";
import type { JuryCaseInput, WorkflowResult } from "@/types/jury";
import { ReadOnlyMetric } from "../ui";
import {
  formatVoteSplit,
  getRequiredHumanAction,
  getStandardAutomationDecision,
  getWorkflowStage,
  routeLabels,
  routeStyles
} from "../../_lib/workspace";

export function WorkflowProgress({
  result,
  isRunning,
  hasUnrunChanges,
  elapsedSeconds
}: {
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  elapsedSeconds: number;
}) {
  const stage = getWorkflowStage(elapsedSeconds);

  return (
    <section className="grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft lg:grid-cols-[1fr_1.25fr_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Route</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isRunning ? (
            <span className="rounded-md border border-amber/30 bg-[#fff3d6] px-2.5 py-1 text-sm font-semibold text-[#7a4d00]">
              {stage.label}
            </span>
          ) : result?.route.routeKind ? (
            <span className={`rounded-md border px-2.5 py-1 text-sm font-semibold ${routeStyles[result.route.routeKind]}`}>
              {routeLabels[result.route.routeKind]}
            </span>
          ) : (
            <span className="rounded-md border border-line bg-[#f5f5f5] px-2.5 py-1 text-sm font-semibold text-graphite">
              {hasUnrunChanges ? "Awaiting rerun" : "Awaiting workflow"}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Reason</p>
        <p className="mt-2 text-sm leading-6 text-graphite">
          {isRunning
            ? stage.detail
            : result?.route.routingReason ?? "Run the workflow to select standard automation, human review, or provisional decision."}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Freshness</p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {isRunning
            ? `${elapsedSeconds}s elapsed`
            : hasUnrunChanges
              ? "Computed sections hidden until rerun"
              : result
                ? "Up to date"
                : "Pending"}
        </p>
      </div>
    </section>
  );
}

export function ReviewerSnapshot({
  caseInput,
  result,
  isRunning,
  hasUnrunChanges,
  elapsedSeconds
}: {
  caseInput: JuryCaseInput;
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  elapsedSeconds: number;
}) {
  const verdict = result?.provisionalDecision?.verdict ?? result?.jury?.verdict;
  const standardDecision = getStandardAutomationDecision(caseInput);
  const stage = getWorkflowStage(elapsedSeconds);
  const disagreement = verdict
    ? formatVoteSplit(verdict.voteSummary)
    : result?.route.routeKind === "standard_automation"
      ? "No jury needed"
      : "Pending";

  const snapshot = [
    {
      label: "Case",
      value: caseInput.title,
      icon: <Search className="h-4 w-4" />
    },
    {
      label: "Verdict",
      value: isRunning
        ? stage.label
        : hasUnrunChanges
          ? "Needs workflow rerun"
          : result?.route.routeKind === "standard_automation"
            ? standardDecision.title
            : verdict?.decision ?? "Awaiting workflow",
      icon: <BadgeCheck className="h-4 w-4" />
    },
    {
      label: "Why",
      value: isRunning
        ? stage.detail
        : hasUnrunChanges
          ? "Inputs changed after the last workflow run."
          : result?.route.routingReason ?? "Run workflow to produce a route-specific reason.",
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: "Disagreement",
      value: disagreement,
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      label: "Next Action",
      value: getRequiredHumanAction(result, caseInput, hasUnrunChanges, isRunning),
      icon: <UserCheck className="h-4 w-4" />
    }
  ];

  return (
    <section className="grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft md:grid-cols-2 xl:grid-cols-5">
      {snapshot.map((item) => (
        <article key={item.label} className="rounded-md border border-line bg-[#f5f5f5] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-graphite">
            <span className="text-teal">{item.icon}</span>
            {item.label}
          </div>
          <p className="mt-2 line-clamp-4 text-sm font-semibold leading-5 text-ink">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
