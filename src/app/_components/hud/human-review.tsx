import { AlertTriangle, Archive, ArrowUpCircle, CheckCircle2, FileText, Save, UserCheck, Workflow } from "lucide-react";
import type { JuryCaseInput, WorkflowResult } from "@/types/jury";
import {
  aliasEvidenceReferences,
  formatEscalationTarget,
  formatEvidenceList,
  formatReviewerVerdict,
  getSystemRecommendation,
  isReviewerAligned,
  queueStatusLabels,
  queueStatusStyles,
  routeLabels,
  type EvidenceAliases,
  type QueueCaseStatus,
  type ReviewerDecision
} from "../../_lib/workspace";

// REVIEWER_NOTE: Human review is presented as an operational final-call workspace, not a passive display of AI output.
export function HumanReviewPanel({
  result,
  caseInput,
  evidenceAliases,
  reviewerDecision,
  exportStatus,
  savedDraftAt,
  similarCases,
  caseStatus,
  onDecisionChange,
  onToggleEvidence,
  onSaveDraft,
  onEscalateSupervisor,
  onSubmitCase
}: {
  result: WorkflowResult;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
  exportStatus: { canExport: boolean; reason: string };
  savedDraftAt: string;
  similarCases: JuryCaseInput[];
  caseStatus: QueueCaseStatus;
  onDecisionChange: <K extends keyof ReviewerDecision>(key: K, value: ReviewerDecision[K]) => void;
  onToggleEvidence: (evidenceId: string) => void;
  onSaveDraft: () => void;
  onEscalateSupervisor: () => void;
  onSubmitCase: () => void;
}) {
  const context = result.humanReviewContext;
  const isArchived = caseStatus === "archived";
  const draftSaved = Boolean(
    savedDraftAt && (!reviewerDecision.updatedAt || Date.parse(savedDraftAt) >= Date.parse(reviewerDecision.updatedAt))
  );
  const draftState = savedDraftAt
    ? draftSaved
      ? `Draft saved ${formatSavedTime(savedDraftAt)}`
      : "Unsaved changes"
    : reviewerDecision.updatedAt
      ? "Unsaved changes"
      : "No draft saved";

  return (
    <section className="rounded-md border border-coral/30 bg-[#fce8e6] p-4 text-coral shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Human Review</h2>
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-3 py-2 text-xs font-semibold ${queueStatusStyles[caseStatus]}`}>
            {queueStatusLabels[caseStatus]}
          </span>
          <span className="rounded-md border border-coral/30 bg-white px-3 py-2 text-xs font-semibold text-coral">
            {draftState}
          </span>
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:bg-[#fff7f4]"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save draft
          </button>
          <button
            type="button"
            onClick={onEscalateSupervisor}
            disabled={isArchived}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-coral/30 bg-white px-4 py-2 text-sm font-semibold text-coral transition hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
            Escalate supervisor
          </button>
          <button
            type="button"
            onClick={onSubmitCase}
            disabled={!exportStatus.canExport || isArchived}
            title={exportStatus.canExport ? "Submit and archive this case." : exportStatus.reason}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a62f08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Submit case
          </button>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ReviewSignalSummary
          indicators={aliasEvidenceReferences(context?.indicators ?? result.route.indicators, evidenceAliases)}
          warnings={aliasEvidenceReferences(context?.warnings ?? result.route.warnings, evidenceAliases)}
          focus={aliasEvidenceReferences(context?.suggestedReviewFocus ?? [], evidenceAliases)}
        />
        <ReviewerVerdictComposer
          caseInput={caseInput}
          evidenceAliases={evidenceAliases}
          reviewerDecision={reviewerDecision}
          onDecisionChange={onDecisionChange}
          onToggleEvidence={onToggleEvidence}
        />
        <div className="grid gap-4 xl:self-start">
          <DecisionRecordPreview
            result={result}
            caseInput={caseInput}
            evidenceAliases={evidenceAliases}
            reviewerDecision={reviewerDecision}
            exportStatus={exportStatus}
            savedDraftAt={savedDraftAt}
            similarCases={similarCases}
            caseStatus={caseStatus}
          />
          <details className="rounded-md border border-coral/30 bg-white text-ink">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">
              Handoff and calibration
            </summary>
            <div className="grid gap-3 border-t border-coral/20 p-4">
              <EscalationWorkflow reviewerDecision={reviewerDecision} />
              <CalibrationPanel result={result} reviewerDecision={reviewerDecision} />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function ReviewSignalSummary({
  indicators,
  warnings,
  focus
}: {
  indicators: string[];
  warnings: string[];
  focus: string[];
}) {
  const groups = [
    { title: "Indicators", items: indicators },
    { title: "Warnings", items: warnings },
    { title: "Review Focus", items: focus }
  ];

  return (
    <div className="grid gap-3 xl:self-start">
      {groups.map((group) => (
        <div key={group.title} className="rounded-md border border-coral/30 bg-white p-3 text-ink">
          <p className="text-xs font-semibold uppercase text-coral">{group.title}</p>
          {group.items.length ? (
            <ul className="mt-2 grid gap-1.5 text-sm leading-5 text-graphite">
              {group.items.slice(0, 3).map((item) => (
                <li key={item} className="[overflow-wrap:anywhere]">{limitWords(item, 12)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-5 text-graphite">No extra context.</p>
          )}
        </div>
      ))}
    </div>
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
    <div className="rounded-md border border-coral/30 bg-white p-4 text-ink xl:self-start">
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
            <option value="escalate">Escalate supervisor</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Reason
          <textarea
            value={reviewerDecision.reason}
            rows={3}
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
                className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-line bg-[#f5f5f5] px-3 text-sm"
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
                <span className="min-w-0 truncate text-graphite">{evidence.label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Override reason
          <textarea
            value={reviewerDecision.overrideReason}
            rows={2}
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
            rows={2}
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
  exportStatus,
  savedDraftAt,
  similarCases,
  caseStatus
}: {
  result: WorkflowResult;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
  exportStatus: { canExport: boolean; reason: string };
  savedDraftAt: string;
  similarCases: JuryCaseInput[];
  caseStatus: QueueCaseStatus;
}) {
  const selectedEvidence = formatEvidenceList(reviewerDecision.evidenceReliedOn, evidenceAliases);
  const recommendation = getSystemRecommendation(result, caseInput);
  const overrideRequired = reviewerDecision.finalVerdict
    ? isReviewerAligned(recommendation, reviewerDecision.finalVerdict)
      ? "Not required"
      : reviewerDecision.overrideReason.trim()
        ? "Provided"
        : "Required"
    : "Pending verdict";
  const reasonStatus = reviewerDecision.finalVerdict && !reviewerDecision.reason.trim()
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <RecordMetric label="Record status" value={reasonStatus} />
        <RecordMetric label="Case state" value={queueStatusLabels[caseStatus]} />
        <RecordMetric label="Export readiness" value={exportStatus.canExport ? "Ready" : exportStatus.reason} wide />
        <RecordMetric label="Saved state" value={savedDraftAt ? formatSavedTime(savedDraftAt) : "Not saved"} />
        <RecordMetric label="Final verdict" value={formatReviewerVerdict(reviewerDecision.finalVerdict)} />
        <RecordMetric
          label="Rationale"
          value={reviewerDecision.reason.trim() ? `${reviewerDecision.reason.trim().length} characters` : "Missing"}
        />
        <RecordMetric label="Evidence count" value={`${reviewerDecision.evidenceReliedOn.length}/${caseInput.evidence.length}`} />
        <RecordMetric label="Override reason" value={overrideRequired} />
        <RecordMetric label="System recommendation" value={recommendation} wide />
        <RecordMetric label="Route" value={routeLabels[result.route.routeKind]} />
        <RecordMetric label="Evidence relied on" value={selectedEvidence} />
        <RecordMetric label="Similar cases" value={precedentHint} wide />
        <RecordMetric
          label="Updated"
          value={reviewerDecision.updatedAt ? new Date(reviewerDecision.updatedAt).toLocaleString() : "Not drafted"}
        />
      </div>
    </div>
  );
}

function RecordMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 rounded-md border border-line bg-white px-2 py-2 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[0.68rem] font-semibold uppercase text-graphite">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function formatSavedTime(value: string) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not saved";
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
