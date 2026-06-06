import { BadgeCheck, FileText, MessageSquare, Search, UserCheck } from "lucide-react";
import type { JuryCaseInput, WorkflowResult } from "@/types/jury";
import { ReadOnlyMetric } from "../ui";
import {
  formatPercent,
  formatVoteSplit,
  getRequiredHumanAction,
  getStandardAutomationDecision,
  getWorkflowStage,
  routeLabels,
  routeStyles
} from "../../_lib/workspace";

export function ReviewActionStrip({
  caseInput,
  result,
  isRunning,
  hasUnrunChanges,
  elapsedSeconds,
  forceHumanReview = false,
  onOpenHumanReview
}: {
  caseInput: JuryCaseInput;
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  elapsedSeconds: number;
  forceHumanReview?: boolean;
  onOpenHumanReview: () => void;
}) {
  const stage = getWorkflowStage(elapsedSeconds);
  const verdict = result?.provisionalDecision?.verdict ?? result?.jury?.verdict;
  const routeKind = forceHumanReview ? "human_review" : result?.route.routeKind;
  const routeLabel = isRunning
    ? stage.label
    : hasUnrunChanges
      ? "Changes made"
      : routeKind
        ? routeLabels[routeKind]
        : "Awaiting workflow";
  const routeTone = routeKind && !isRunning && !hasUnrunChanges
    ? routeStyles[routeKind]
    : hasUnrunChanges
      ? "border-amber/30 bg-[#fff3d6] text-[#7a4d00]"
      : "border-line bg-white text-graphite";
  const reason = isRunning
    ? stage.detail
    : hasUnrunChanges
      ? "Inputs changed after the last workflow run."
      : forceHumanReview
        ? "Reviewer overruled the provisional AI decision during cooldown."
      : result?.route.routingReason ?? "Run workflow to produce a route-specific reason.";
  const voteSplit = verdict
    ? formatVoteSplit(verdict.voteSummary)
    : routeKind === "standard_automation"
      ? "No jury needed"
      : "Vote pending";
  const freshness = isRunning
    ? `${elapsedSeconds}s elapsed`
    : hasUnrunChanges
      ? "Rerun needed"
      : result
        ? "Up to date"
        : "Pending";
  const warningCount = result?.humanReviewContext?.warnings.length ?? result?.route.warnings.length ?? 0;
  const focusCount = result?.humanReviewContext?.suggestedReviewFocus.length ?? 0;
  const nextAction = forceHumanReview
    ? "Complete final verdict and rationale"
    : getRequiredHumanAction(result, caseInput, hasUnrunChanges, isRunning);
  const showHumanAction = routeKind === "human_review" && !isRunning && !hasUnrunChanges;
  const stripIsUrgent = routeKind === "human_review" && !isRunning && !hasUnrunChanges;
  const stripTone = stripIsUrgent
    ? "border-coral/30 bg-[#fce8e6] text-coral"
    : "border-line bg-white text-ink";
  const chipTone = stripIsUrgent
    ? "border-coral/30 bg-white text-coral"
    : "border-line bg-[#f5f5f5] text-graphite";
  const detailTone = stripIsUrgent ? "text-coral" : "text-graphite";

  return (
    <section className={`rounded-md border p-3 shadow-soft ${stripTone}`}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2.5 py-1 text-sm font-semibold ${routeTone}`}>{routeLabel}</span>
            <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
              {freshness}
            </span>
            <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
              {voteSplit}
            </span>
            {verdict ? (
              <>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
                  Risk {formatPercent(verdict.riskScore)}
                </span>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
                  Confidence {formatPercent(verdict.overallConfidence)}
                </span>
              </>
            ) : null}
            {warningCount ? (
              <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
                Warnings {warningCount}
              </span>
            ) : null}
            {focusCount ? (
              <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
                Focus {focusCount}
              </span>
            ) : null}
          </div>
          <p className={`mt-2 line-clamp-2 text-sm leading-5 ${detailTone}`}>
            <span className="font-semibold">Reason:</span> {reason}
          </p>
          <p className={`mt-1 text-xs font-semibold ${detailTone}`}>Next action: {nextAction}</p>
        </div>

        {showHumanAction ? (
          <button
            type="button"
            onClick={onOpenHumanReview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a62f08]"
          >
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Open Human Review
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function WorkflowProgress({
  result,
  isRunning,
  hasUnrunChanges,
  elapsedSeconds,
  forceHumanReview = false
}: {
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  elapsedSeconds: number;
  forceHumanReview?: boolean;
}) {
  const stage = getWorkflowStage(elapsedSeconds);
  const routeKind = forceHumanReview ? "human_review" : result?.route.routeKind;

  return (
    <section className="grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft lg:grid-cols-[1fr_1.25fr_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Route</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isRunning ? (
            <span className="rounded-md border border-amber/30 bg-[#fff3d6] px-2.5 py-1 text-sm font-semibold text-[#7a4d00]">
              {stage.label}
            </span>
          ) : routeKind ? (
            <span className={`rounded-md border px-2.5 py-1 text-sm font-semibold ${routeStyles[routeKind]}`}>
              {routeLabels[routeKind]}
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
            : forceHumanReview
              ? "Reviewer overruled the provisional AI decision during cooldown."
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
