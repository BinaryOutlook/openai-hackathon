import { AlertTriangle, CheckCircle2, FileText, UserCheck, Workflow } from "lucide-react";
import type { JuryCaseInput, WorkflowResult } from "@/types/jury";
import { ReadOnlyMetric, ReviewList } from "../ui";
import {
  aliasEvidenceReferences,
  formatEscalationTarget,
  formatEvidenceList,
  getSystemRecommendation,
  isReviewerAligned,
  routeLabels,
  type EvidenceAliases,
  type ReviewerDecision
} from "../../_lib/workspace";

export function HumanReviewPanel({
  result,
  caseInput,
  evidenceAliases,
  reviewerDecision,
  similarCases,
  onDecisionChange,
  onToggleEvidence
}: {
  result: WorkflowResult;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
  similarCases: JuryCaseInput[];
  onDecisionChange: <K extends keyof ReviewerDecision>(key: K, value: ReviewerDecision[K]) => void;
  onToggleEvidence: (evidenceId: string) => void;
}) {
  const context = result.humanReviewContext;

  return (
    <section className="rounded-md border border-coral/30 bg-[#fce8e6] p-4 text-coral shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Human Review</h2>
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-3">
          <ReviewList title="Indicators" items={aliasEvidenceReferences(context?.indicators ?? result.route.indicators, evidenceAliases)} />
          <ReviewList title="Warnings" items={aliasEvidenceReferences(context?.warnings ?? result.route.warnings, evidenceAliases)} />
          <ReviewList title="Review Focus" items={aliasEvidenceReferences(context?.suggestedReviewFocus ?? [], evidenceAliases)} />
        </div>
        <ReviewerVerdictComposer
          caseInput={caseInput}
          evidenceAliases={evidenceAliases}
          reviewerDecision={reviewerDecision}
          onDecisionChange={onDecisionChange}
          onToggleEvidence={onToggleEvidence}
        />
        <div className="grid gap-4">
          <DecisionRecordPreview
            result={result}
            caseInput={caseInput}
            evidenceAliases={evidenceAliases}
            reviewerDecision={reviewerDecision}
            similarCases={similarCases}
          />
          <EscalationWorkflow reviewerDecision={reviewerDecision} />
          <CalibrationPanel result={result} reviewerDecision={reviewerDecision} />
        </div>
      </div>
    </section>
  );
}

function ReviewerVerdictComposer({
  caseInput,
  evidenceAliases,
  reviewerDecision,
  onDecisionChange,
  onToggleEvidence
}: {
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
  onDecisionChange: <K extends keyof ReviewerDecision>(key: K, value: ReviewerDecision[K]) => void;
  onToggleEvidence: (evidenceId: string) => void;
}) {
  return (
    <div className="rounded-md border border-coral/30 bg-white p-4 text-ink">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-teal" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Reviewer Verdict Composer</h3>
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Final verdict
          <select
            value={reviewerDecision.finalVerdict}
            onChange={(event) => onDecisionChange("finalVerdict", event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="">Select final verdict</option>
            <option value="approve_return">Approve return/refund</option>
            <option value="approve_with_note">Approve with note</option>
            <option value="reject_return">Reject with reason</option>
            <option value="request_more_evidence">Request more evidence</option>
            <option value="escalate">Escalate</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Reason
          <textarea
            value={reviewerDecision.reason}
            rows={4}
            onChange={(event) => onDecisionChange("reason", event.target.value)}
            className="resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6"
            placeholder="Write the final reviewer rationale or approval note."
          />
        </label>

        <div>
          <p className="text-sm font-medium">Evidence relied on</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {caseInput.evidence.map((evidence) => (
              <label
                key={evidence.id}
                className="flex min-h-10 items-center gap-2 rounded-md border border-line bg-[#f5f5f5] px-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={reviewerDecision.evidenceReliedOn.includes(evidence.id)}
                  onChange={() => onToggleEvidence(evidence.id)}
                  className="h-4 w-4 accent-teal"
                />
                <span className="font-mono text-xs font-semibold text-teal">
                  {evidenceAliases[evidence.id] ?? evidence.id}
                </span>
                <span className="truncate text-graphite">{evidence.label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Override reason
          <textarea
            value={reviewerDecision.overrideReason}
            rows={3}
            onChange={(event) => onDecisionChange("overrideReason", event.target.value)}
            className="resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6"
            placeholder="Required if the human decision differs from the system recommendation."
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Escalation target
          <select
            value={reviewerDecision.escalationTarget}
            onChange={(event) => onDecisionChange("escalationTarget", event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="marketplace-ops">Marketplace Ops</option>
            <option value="risk-team">Risk Team</option>
            <option value="logistics-review">Logistics Review</option>
            <option value="seller-performance">Seller Performance</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Notes
          <textarea
            value={reviewerDecision.notes}
            rows={3}
            onChange={(event) => onDecisionChange("notes", event.target.value)}
            className="resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6"
            placeholder="Handoff notes for the next reviewer or operations team."
          />
        </label>
      </div>
    </div>
  );
}

function DecisionRecordPreview({
  result,
  caseInput,
  evidenceAliases,
  reviewerDecision,
  similarCases
}: {
  result: WorkflowResult;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
  similarCases: JuryCaseInput[];
}) {
  const selectedEvidence = formatEvidenceList(reviewerDecision.evidenceReliedOn, evidenceAliases);
  const recommendation = getSystemRecommendation(result, caseInput);
  const reasonStatus = reviewerDecision.finalVerdict === "reject_return" && !reviewerDecision.reason.trim()
    ? "Reason needed"
    : reviewerDecision.finalVerdict
      ? "Decision drafted"
      : "Awaiting verdict";
  const precedentHint = similarCases.length
    ? similarCases.map((demoCase) => demoCase.id).join(", ")
    : "No close demo precedent";

  return (
    <div className="rounded-md border border-coral/30 bg-white p-4 text-ink">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-teal" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Decision Record</h3>
      </div>
      <div className="mt-3 grid gap-2">
        <ReadOnlyMetric label="Record status" value={reasonStatus} />
        <ReadOnlyMetric label="System recommendation" value={recommendation} />
        <ReadOnlyMetric label="Route" value={routeLabels[result.route.routeKind]} />
        <ReadOnlyMetric label="Evidence relied on" value={selectedEvidence} />
        <ReadOnlyMetric label="Similar cases" value={precedentHint} />
        <ReadOnlyMetric
          label="Updated"
          value={reviewerDecision.updatedAt ? new Date(reviewerDecision.updatedAt).toLocaleString() : "Not drafted"}
        />
      </div>
    </div>
  );
}

function EscalationWorkflow({ reviewerDecision }: { reviewerDecision: ReviewerDecision }) {
  const steps = [
    "AI jury context prepared",
    reviewerDecision.finalVerdict ? "Reviewer verdict drafted" : "Reviewer verdict pending",
    reviewerDecision.escalationTarget
      ? `Handoff target: ${formatEscalationTarget(reviewerDecision.escalationTarget)}`
      : "Handoff target pending"
  ];

  return (
    <div className="rounded-md border border-coral/30 bg-white p-4 text-ink">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-teal" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Escalation Handoff</h3>
      </div>
      <ol className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm text-graphite">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffebe6] text-xs font-semibold text-teal">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CalibrationPanel({
  result,
  reviewerDecision
}: {
  result: WorkflowResult;
  reviewerDecision: ReviewerDecision;
}) {
  const systemDecision = result.jury?.verdict.decision ?? result.route.routeKind;
  const alignment = reviewerDecision.finalVerdict
    ? isReviewerAligned(systemDecision, reviewerDecision.finalVerdict)
      ? "Aligned with system recommendation"
      : "Human override requires rationale"
    : "Awaiting reviewer verdict";

  return (
    <div className="rounded-md border border-coral/30 bg-white p-4 text-ink">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Reviewer Calibration</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-graphite">{alignment}</p>
      <p className="mt-2 text-xs leading-5 text-graphite">
        Later outcome comparison can be attached to this decision record when production data is connected.
      </p>
    </div>
  );
}
