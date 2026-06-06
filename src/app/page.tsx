"use client";

import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  FileText,
  Gavel,
  History,
  ImagePlus,
  ListFilter,
  Loader2,
  MessageSquare,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserCheck,
  Users,
  Workflow
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import type {
  AgentOpinion,
  AgentVote,
  EvidenceItem,
  EvidenceSource,
  HumanOverride,
  JuryCaseInput,
  RequestReason,
  RouteKind,
  WorkflowResult
} from "@/types/jury";

const voteLabels: Record<AgentVote, string> = {
  support_buyer: "Buyer",
  support_seller: "Seller",
  need_more_evidence: "More evidence",
  escalate: "Escalate"
};

const voteStyles: Record<AgentVote, string> = {
  support_buyer: "border-teal/30 bg-mint text-teal",
  support_seller: "border-line bg-gray-100 text-ink",
  need_more_evidence: "border-amber/30 bg-[#fff3d6] text-[#7a4d00]",
  escalate: "border-coral/30 bg-[#fce8e6] text-coral"
};

const requestReasonLabels: Record<RequestReason, string> = {
  do_not_want_anymore: "Do not want anymore",
  description_mismatch: "Description mismatch",
  material_mismatch: "Material mismatch",
  size_mismatch: "Size mismatch",
  production_or_warranty_mismatch: "Production or warranty",
  color_style_model_mismatch: "Color, style, or model",
  quality_issue: "Quality issue",
  missing_item_or_accessory: "Missing item or accessory",
  damaged_or_dirty_item: "Damaged or dirty item"
};

const sourceLabels: Record<EvidenceSource, string> = {
  buyer: "Buyer",
  seller: "Seller",
  platform_policy: "Policy",
  logistics: "Logistics",
  history: "History",
  reviewer: "Reviewer"
};

const evidenceSourcePrefixes: Record<EvidenceSource, string> = {
  buyer: "B",
  seller: "S",
  reviewer: "R",
  logistics: "L",
  platform_policy: "P",
  history: "H"
};

const routeLabels: Record<RouteKind, string> = {
  standard_automation: "Standard automation",
  human_review: "Human review",
  provisional_ai_decision: "Provisional decision"
};

const routeStyles: Record<RouteKind, string> = {
  standard_automation: "border-teal/30 bg-mint text-teal",
  human_review: "border-coral/30 bg-[#fce8e6] text-coral",
  provisional_ai_decision: "border-amber/30 bg-[#fff3d6] text-[#7a4d00]"
};

type EvidenceAliases = Record<string, string>;

type ReviewerDecision = {
  finalVerdict: string;
  reason: string;
  evidenceReliedOn: string[];
  overrideReason: string;
  escalationTarget: string;
  notes: string;
};

function cloneCase(caseInput: JuryCaseInput): JuryCaseInput {
  return JSON.parse(JSON.stringify(caseInput)) as JuryCaseInput;
}

function buildDefaultReviewerDecision(caseInput?: JuryCaseInput): ReviewerDecision {
  return {
    finalVerdict: "",
    reason: "",
    evidenceReliedOn: caseInput?.evidence.slice(0, 2).map((evidence) => evidence.id) ?? [],
    overrideReason: "",
    escalationTarget: "marketplace-ops",
    notes: ""
  };
}

export default function Home() {
  const [caseInput, setCaseInput] = useState<JuryCaseInput>(() => cloneCase(DEMO_CASES[0]));
  const [selectedCaseId, setSelectedCaseId] = useState(DEMO_CASES[0].id);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [uploadSource, setUploadSource] = useState<EvidenceSource>("buyer");
  const [overridePoint, setOverridePoint] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaseEditable, setIsCaseEditable] = useState(false);
  const [hasUnrunChanges, setHasUnrunChanges] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewerDecision, setReviewerDecision] = useState<ReviewerDecision>(() =>
    buildDefaultReviewerDecision(DEMO_CASES[0])
  );

  useEffect(() => {
    void runWorkflow(cloneCase(DEMO_CASES[0]));
  }, []);

  useEffect(() => {
    if (!result?.provisionalDecision || hasUnrunChanges || isRunning) {
      setCooldownRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((Date.parse(result.provisionalDecision!.expiresAt) - Date.now()) / 1000)
      );
      setCooldownRemaining(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [hasUnrunChanges, isRunning, result?.provisionalDecision?.expiresAt]);

  useEffect(() => {
    if (!isRunning || !runStartedAt) {
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, runStartedAt]);

  const evidenceSummary = useMemo(() => {
    return caseInput.evidence.reduce<Record<EvidenceItem["kind"], number>>(
      (summary, evidence) => {
        summary[evidence.kind] += 1;
        return summary;
      },
      { image: 0, text: 0, logistics: 0, policy: 0, history: 0 }
    );
  }, [caseInput.evidence]);

  const evidenceAliases = useMemo(() => buildEvidenceAliases(caseInput.evidence), [caseInput.evidence]);
  const displayedResult = isRunning || hasUnrunChanges ? null : result;

  async function runWorkflow(input = caseInput) {
    const inputSnapshot = cloneCase(input);
    setIsRunning(true);
    setError(null);
    setResult(null);
    setCooldownRemaining(0);
    setElapsedSeconds(0);
    setRunStartedAt(Date.now());
    setHasUnrunChanges(false);

    try {
      const response = await fetch("/api/jury/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inputSnapshot)
      });

      if (!response.ok) {
        throw new Error(`Workflow run failed with status ${response.status}`);
      }

      const payload = (await response.json()) as WorkflowResult;
      setResult(payload);
      setOverridePoint("");
      setReviewerDecision(buildDefaultReviewerDecision(inputSnapshot));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run workflow.");
    } finally {
      setIsRunning(false);
      setRunStartedAt(null);
    }
  }

  function loadCase(caseId: string) {
    const nextCase = cloneCase(DEMO_CASES.find((demoCase) => demoCase.id === caseId) ?? DEMO_CASES[0]);
    setSelectedCaseId(caseId);
    setCaseInput(nextCase);
    setIsCaseEditable(false);
    setReviewerDecision(buildDefaultReviewerDecision(nextCase));
    setHasUnrunChanges(false);
    void runWorkflow(nextCase);
  }

  function markInputChanged() {
    setHasUnrunChanges(true);
    setResult(null);
    setCooldownRemaining(0);
  }

  function updateCase<K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) {
    setCaseInput((current) => ({
      ...current,
      [key]: value
    }));
    markInputChanged();
  }

  async function addEvidenceFiles(files: FileList | null, source: EvidenceSource) {
    if (!files?.length) {
      return;
    }

    const uploaded = await Promise.all(
      Array.from(files).map(async (file, index): Promise<EvidenceItem> => {
        const imageDataUrl = await fileToDataUrl(file);
        return {
          id: `${evidenceSourcePrefixes[source]}${Date.now()}-${index + 1}`,
          label: file.name,
          source,
          kind: "image",
          summary: `Uploaded ${sourceLabels[source].toLowerCase()} evidence image.`,
          imageDataUrl
        };
      })
    );

    setCaseInput((current) => ({
      ...current,
      evidence: [...current.evidence, ...uploaded]
    }));
    markInputChanged();
  }

  function updateReviewerDecision<K extends keyof ReviewerDecision>(key: K, value: ReviewerDecision[K]) {
    setReviewerDecision((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleReviewerEvidence(evidenceId: string) {
    setReviewerDecision((current) => {
      const selected = current.evidenceReliedOn.includes(evidenceId);
      return {
        ...current,
        evidenceReliedOn: selected
          ? current.evidenceReliedOn.filter((id) => id !== evidenceId)
          : [...current.evidenceReliedOn, evidenceId]
      };
    });
  }

  function exportVerdict() {
    if (!displayedResult) {
      return;
    }

    const humanOverride = buildHumanOverride(overridePoint);
    const exportPayload = {
      case: caseInput,
      reviewerDecision,
      workflow: {
        ...displayedResult,
        humanOverride,
        audit: {
          ...displayedResult.audit,
          humanOverride,
          finalDecision: getClientFinalDecision(displayedResult, humanOverride, cooldownRemaining)
        }
      },
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${caseInput.id}-workflow-audit.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-4 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal text-white shadow-brand">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-medium leading-tight sm:text-3xl">AI Return Jury</h1>
              <p className="mt-1 text-sm text-graphite">Shrimp marketplace dispute operations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              result={displayedResult}
              isRunning={isRunning}
              hasUnrunChanges={hasUnrunChanges}
              elapsedSeconds={elapsedSeconds}
            />
            {hasUnrunChanges ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber/30 bg-[#fff3d6] px-3 text-sm font-semibold text-[#7a4d00]">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Changes made
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void runWorkflow()}
              disabled={isRunning}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e64a19] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Gavel className="h-4 w-4" aria-hidden="true" />
              )}
              Run workflow
            </button>
            <button
              type="button"
              onClick={exportVerdict}
              disabled={!displayedResult}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-3 rounded-md border border-coral/40 bg-[#fce8e6] px-4 py-3 text-sm text-coral">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        <WorkflowProgress
          result={displayedResult}
          isRunning={isRunning}
          hasUnrunChanges={hasUnrunChanges}
          elapsedSeconds={elapsedSeconds}
        />

        <ReviewerSnapshot
          caseInput={caseInput}
          result={displayedResult}
          isRunning={isRunning}
          hasUnrunChanges={hasUnrunChanges}
          elapsedSeconds={elapsedSeconds}
        />

        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <ReviewQueue selectedCaseId={selectedCaseId} onSelectCase={loadCase} />
            <CaseIntake
              caseInput={caseInput}
              uploadSource={uploadSource}
              isEditable={isCaseEditable}
              isRunning={isRunning}
              hasUnrunChanges={hasUnrunChanges}
              onToggleEditable={() => setIsCaseEditable((current) => !current)}
              onUpdateCase={updateCase}
              onUpdateUploadSource={setUploadSource}
              onAddEvidence={addEvidenceFiles}
            />
          </div>
          <EvidenceBoard
            caseInput={caseInput}
            evidenceSummary={evidenceSummary}
            evidenceAliases={evidenceAliases}
          />
          <VerdictPanel
            caseInput={caseInput}
            result={displayedResult}
            isRunning={isRunning}
            hasUnrunChanges={hasUnrunChanges}
            cooldownRemaining={cooldownRemaining}
            evidenceAliases={evidenceAliases}
          />
        </section>

        {displayedResult?.route.routeKind === "human_review" ? (
          <HumanReviewPanel
            result={displayedResult}
            caseInput={caseInput}
            evidenceAliases={evidenceAliases}
            reviewerDecision={reviewerDecision}
            onDecisionChange={updateReviewerDecision}
            onToggleEvidence={toggleReviewerEvidence}
          />
        ) : null}

        {displayedResult?.route.routeKind === "provisional_ai_decision" ? (
          <CooldownOverridePanel
            result={displayedResult}
            cooldownRemaining={cooldownRemaining}
            overridePoint={overridePoint}
            onOverridePointChange={setOverridePoint}
          />
        ) : null}

        {displayedResult?.route.routeKind !== "standard_automation" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
            <JuryPanel
              opinions={displayedResult?.jury?.opinions ?? []}
              isRunning={isRunning}
              evidenceAliases={evidenceAliases}
            />
            <DeliberationPanel
              result={displayedResult?.jury ?? null}
              caseInput={caseInput}
              evidenceAliases={evidenceAliases}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ReviewQueue({
  selectedCaseId,
  onSelectCase
}: {
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
}) {
  const filters = ["High disagreement", "Needs escalation", "Policy risk", "Low confidence", "New evidence"];

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Review Queue</h2>
          <p className="mt-1 text-xs text-graphite">Next-case clarity for reviewers</p>
        </div>
        <ListFilter className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className="rounded-full border border-line bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-graphite transition hover:border-teal hover:bg-[#fff7f4] hover:text-teal"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {DEMO_CASES.map((demoCase) => {
          const meta = getQueueMeta(demoCase);
          const selected = demoCase.id === selectedCaseId;
          return (
            <button
              key={demoCase.id}
              type="button"
              onClick={() => onSelectCase(demoCase.id)}
              className={`rounded-md border p-3 text-left transition ${
                selected
                  ? "border-teal bg-[#fff7f4] shadow-brand"
                  : "border-line bg-white hover:border-[#fdb098] hover:bg-[#fff7f4]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold leading-5">{demoCase.title}</p>
                  <p className="mt-1 text-xs text-graphite">{demoCase.id}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.tone}`}>
                  {meta.priority}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-graphite">
                <span>Risk: {meta.risk}</span>
                <span>SLA: {meta.sla}</span>
                <span>Waiting: {meta.waiting}</span>
                <span>Owner: {meta.owner}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CaseIntake({
  caseInput,
  uploadSource,
  isEditable,
  isRunning,
  hasUnrunChanges,
  onToggleEditable,
  onUpdateCase,
  onUpdateUploadSource,
  onAddEvidence
}: {
  caseInput: JuryCaseInput;
  uploadSource: EvidenceSource;
  isEditable: boolean;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  onToggleEditable: () => void;
  onUpdateCase: <K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) => void;
  onUpdateUploadSource: (source: EvidenceSource) => void;
  onAddEvidence: (files: FileList | null, source: EvidenceSource) => void;
}) {
  const controlsDisabled = !isEditable || isRunning;
  const inputClass =
    "min-h-10 rounded-md border border-line bg-white px-3 text-sm disabled:bg-[#f5f5f5] disabled:text-graphite";
  const textAreaClass =
    "resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 disabled:bg-[#f5f5f5] disabled:text-graphite";

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Case Intake</h2>
          <p className="mt-1 text-xs text-graphite">
            {isEditable ? "Editing reviewer copy" : "Buyer and seller submissions locked"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleEditable}
          disabled={isRunning}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-teal bg-white px-3 text-sm font-semibold text-teal transition hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          {isEditable ? "Lock" : "Edit"}
        </button>
      </div>

      {hasUnrunChanges ? (
        <div className="mt-3 rounded-md border border-amber/30 bg-[#fff3d6] px-3 py-2 text-sm font-medium text-[#7a4d00]">
          Changes made. Run workflow to refresh computed sections.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyMetric label="Value" value={`$${caseInput.orderValue}`} />
          <ReadOnlyMetric label="Category" value={caseInput.category} />
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Request reason
          <select
            value={caseInput.requestReason}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("requestReason", event.target.value as RequestReason)}
            className={inputClass}
          >
            {Object.entries(requestReasonLabels).map(([reason, label]) => (
              <option key={reason} value={reason}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm font-medium has-[:disabled]:bg-[#f5f5f5]">
          <input
            type="checkbox"
            checked={caseInput.sellerAgreesToReturn}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("sellerAgreesToReturn", event.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Seller agrees to standard return
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Buyer claim
          <textarea
            value={caseInput.buyerClaim}
            rows={5}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("buyerClaim", event.target.value)}
            className={textAreaClass}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Seller response
          <textarea
            value={caseInput.sellerResponse}
            rows={5}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("sellerResponse", event.target.value)}
            className={textAreaClass}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Upload source
          <select
            value={uploadSource}
            onChange={(event) => onUpdateUploadSource(event.target.value as EvidenceSource)}
            className={inputClass}
          >
            {(["buyer", "seller", "reviewer", "logistics"] satisfies EvidenceSource[]).map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-teal bg-[#ffebe6] px-3 text-sm font-semibold text-teal transition hover:bg-[#fff7f4]">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Add image evidence
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void onAddEvidence(event.target.files, uploadSource)}
          />
        </label>
      </div>
    </section>
  );
}

function EvidenceBoard({
  caseInput,
  evidenceSummary,
  evidenceAliases
}: {
  caseInput: JuryCaseInput;
  evidenceSummary: Record<EvidenceItem["kind"], number>;
  evidenceAliases: EvidenceAliases;
}) {
  const buyerEvidence = caseInput.evidence.filter((evidence) => evidence.source === "buyer");
  const sellerEvidence = caseInput.evidence.filter((evidence) => evidence.source === "seller");
  const neutralEvidence = caseInput.evidence.filter(
    (evidence) => evidence.source !== "buyer" && evidence.source !== "seller"
  );

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Evidence Board</h2>
          <p className="mt-1 text-sm text-graphite">{caseInput.productTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {Object.entries(evidenceSummary).map(([kind, count]) => (
            <span key={kind} className="rounded-full border border-line bg-[#f5f5f5] px-2.5 py-1 capitalize text-graphite">
              {kind}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1fr)]">
        <EvidenceColumn
          title="Buyer"
          subtitle={summarizeHistory(caseInput.buyerHistory)}
          icon={<Users className="h-4 w-4" />}
          evidence={buyerEvidence}
          evidenceAliases={evidenceAliases}
          context={caseInput.buyerHistory}
        />
        <NeutralEvidenceColumn
          caseInput={caseInput}
          evidence={neutralEvidence}
          evidenceAliases={evidenceAliases}
        />
        <EvidenceColumn
          title="Seller"
          subtitle={summarizeHistory(caseInput.sellerHistory)}
          icon={<Archive className="h-4 w-4" />}
          evidence={sellerEvidence}
          evidenceAliases={evidenceAliases}
          context={caseInput.sellerHistory}
        />
      </div>
    </section>
  );
}

function EvidenceColumn({
  title,
  subtitle,
  icon,
  evidence,
  evidenceAliases,
  context
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  evidence: EvidenceItem[];
  evidenceAliases: EvidenceAliases;
  context: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-teal">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-graphite">{subtitle}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-md bg-white p-2 text-xs leading-5 text-graphite">{context}</p>
      <div className="mt-3 grid gap-3">
        {evidence.length ? (
          evidence.map((item) => (
            <EvidenceCard key={item.id} evidence={item} evidenceAliases={evidenceAliases} />
          ))
        ) : (
          <EmptyState label={`No ${title.toLowerCase()} evidence`} compact />
        )}
      </div>
    </div>
  );
}

function NeutralEvidenceColumn({
  caseInput,
  evidence,
  evidenceAliases
}: {
  caseInput: JuryCaseInput;
  evidence: EvidenceItem[];
  evidenceAliases: EvidenceAliases;
}) {
  return (
    <div className="rounded-md border border-teal/20 bg-[#fff7f4] p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold">Policy, Logistics, Reviewer</h3>
          <p className="mt-1 text-xs text-graphite">Neutral trail and platform context</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-[#fdb098] bg-white p-3">
        <p className="text-xs font-semibold uppercase text-teal">Policy Clause</p>
        <MarkdownText className="mt-2 text-sm leading-6 text-graphite" text={caseInput.policyText} />
      </div>

      <div className="mt-3 rounded-md border border-line bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="h-4 w-4 text-teal" aria-hidden="true" />
          Timeline
        </div>
        <ol className="mt-3 grid gap-2">
          {caseInput.logisticsEvents.map((event) => (
            <li key={event} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-sm leading-5 text-graphite">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal" />
              <span>{event}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 grid gap-3">
        {evidence.map((item) => (
          <EvidenceCard key={item.id} evidence={item} evidenceAliases={evidenceAliases} />
        ))}
      </div>
    </div>
  );
}

function EvidenceCard({
  evidence,
  evidenceAliases
}: {
  evidence: EvidenceItem;
  evidenceAliases: EvidenceAliases;
}) {
  return (
    <article className="rounded-md border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-teal">
            {evidenceAliases[evidence.id] ?? evidence.id}
          </p>
          <h4 className="mt-1 text-sm font-semibold">{evidence.label}</h4>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-[#ffebe6] px-2 py-1 text-xs font-semibold text-teal">
            {sourceLabels[evidence.source]}
          </span>
          <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-xs font-semibold capitalize text-graphite">
            {evidence.kind}
          </span>
        </div>
      </div>
      {evidence.imageDataUrl ? (
        <img
          src={evidence.imageDataUrl}
          alt={evidence.label}
          className="mt-3 aspect-[16/10] w-full rounded-md border border-line object-cover"
        />
      ) : null}
      <MarkdownText className="mt-3 text-sm leading-6 text-graphite" text={evidence.summary} />
    </article>
  );
}

function WorkflowProgress({
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

function ReviewerSnapshot({
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

function VerdictPanel({
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

function HumanReviewPanel({
  result,
  caseInput,
  evidenceAliases,
  reviewerDecision,
  onDecisionChange,
  onToggleEvidence
}: {
  result: WorkflowResult;
  caseInput: JuryCaseInput;
  evidenceAliases: EvidenceAliases;
  reviewerDecision: ReviewerDecision;
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
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <ReviewList title="Indicators" items={aliasEvidenceReferences(context?.indicators ?? result.route.indicators, evidenceAliases)} />
        <ReviewList title="Warnings" items={aliasEvidenceReferences(context?.warnings ?? result.route.warnings, evidenceAliases)} />
        <ReviewList title="Review Focus" items={aliasEvidenceReferences(context?.suggestedReviewFocus ?? [], evidenceAliases)} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ReviewerVerdictComposer
          caseInput={caseInput}
          evidenceAliases={evidenceAliases}
          reviewerDecision={reviewerDecision}
          onDecisionChange={onDecisionChange}
          onToggleEvidence={onToggleEvidence}
        />
        <div className="grid gap-4">
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
            <option value="reject_return">Reject return</option>
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
            placeholder="Write the final reviewer rationale."
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

function CooldownOverridePanel({
  result,
  cooldownRemaining,
  overridePoint,
  onOverridePointChange
}: {
  result: WorkflowResult;
  cooldownRemaining: number;
  overridePoint: string;
  onOverridePointChange: (value: string) => void;
}) {
  const overrideCaptured = overridePoint.trim().length > 0;

  return (
    <section className="rounded-md border border-amber/40 bg-[#fff3d6] p-4 text-[#7a4d00] shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Cooldown Override</h2>
        <span className="rounded-md border border-amber/40 bg-white px-2.5 py-1 text-sm font-semibold">
          {overrideCaptured
            ? "Override captured"
            : cooldownRemaining > 0
              ? `${cooldownRemaining}s remaining`
              : "AI final after cooldown"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-md border border-amber/30 bg-white p-3">
          <p className="text-xs font-semibold uppercase">Provisional decision</p>
          <p className="mt-2 text-sm leading-6">{result.provisionalDecision?.verdict.decision}</p>
          <p className="mt-2 text-xs font-semibold">Expires at {result.provisionalDecision?.expiresAt}</p>
        </div>
        <label className="grid gap-1 text-sm font-medium">
          Human overruling point
          <textarea
            value={overridePoint}
            rows={4}
            onChange={(event) => onOverridePointChange(event.target.value)}
            className="resize-none rounded-md border border-amber/40 bg-white px-3 py-2 text-sm leading-6 text-ink"
            placeholder="Record why a reviewer overruled the provisional decision."
          />
        </label>
      </div>
    </section>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-coral/30 bg-white p-3">
      <p className="text-xs font-semibold uppercase">{title}</p>
      {items.length ? (
        <ul className="mt-2 grid gap-2 text-sm leading-6">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6">No extra context.</p>
      )}
    </div>
  );
}

function JuryPanel({
  opinions,
  isRunning,
  evidenceAliases
}: {
  opinions: AgentOpinion[];
  isRunning: boolean;
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
        <EmptyState label={isRunning ? "Jury running" : "No opinions yet"} />
      )}
    </section>
  );
}

function DeliberationPanel({
  result,
  caseInput,
  evidenceAliases
}: {
  result: WorkflowResult["jury"];
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
        <EmptyState label="Awaiting deliberation" />
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

function SimilarPastCases({ caseInput }: { caseInput: JuryCaseInput }) {
  const similar = DEMO_CASES.filter(
    (demoCase) =>
      demoCase.id !== caseInput.id &&
      (demoCase.requestReason === caseInput.requestReason || demoCase.category === caseInput.category)
  ).slice(0, 2);

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

function RiskPanel({ result }: { result: WorkflowResult | null }) {
  const warnings = uniqueText([
    ...(result?.route.warnings ?? []),
    ...(result?.jury?.verdict.escalationReasons ?? [])
  ]);
  const indicators = result?.route.indicators ?? [];
  const items = uniqueText([...warnings, ...indicators]).slice(0, 4);

  return (
    <div className="rounded-md border border-line bg-[#f5f5f5] p-3">
      <p className="text-xs font-semibold uppercase text-teal">Why risky</p>
      {items.length ? (
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-graphite">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-graphite">No hard risk warning on the current recommendation.</p>
      )}
    </div>
  );
}

function PendingComputedSection({
  isRunning,
  hasUnrunChanges
}: {
  isRunning: boolean;
  hasUnrunChanges: boolean;
}) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-amber/40 bg-[#fff3d6] p-4 text-[#7a4d00]">
      <div className="flex items-center gap-2">
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <TimerReset className="h-4 w-4" aria-hidden="true" />
        )}
        <p className="text-sm font-semibold">
          {isRunning ? "Computed sections pending" : hasUnrunChanges ? "Workflow refresh required" : "Pending"}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6">
        {isRunning
          ? "Verdict, routing, jury, and audit output are hidden until the current run finishes."
          : "Run workflow to replace stale generated output with a fresh decision record."}
      </p>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-16 rounded-md border border-line bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase text-graphite">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</p>
    </div>
  );
}

function StatusPill({
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
  if (isRunning) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber/30 bg-[#fff3d6] px-3 text-sm font-semibold text-[#7a4d00]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {getWorkflowStage(elapsedSeconds).label}
      </span>
    );
  }

  if (hasUnrunChanges) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber/30 bg-[#fff3d6] px-3 text-sm font-semibold text-[#7a4d00]">
        <TimerReset className="h-4 w-4" aria-hidden="true" />
        Rerun needed
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-graphite">
      <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
      {result ? routeLabels[result.route.routeKind] : "Ready"}
    </span>
  );
}

function MetricBar({ label, value, tone }: { label: string; value: number; tone: "teal" | "amber" | "coral" | "cedar" }) {
  const colors = {
    teal: "bg-teal",
    amber: "bg-amber",
    coral: "bg-coral",
    cedar: "bg-cedar"
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-line">
        <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.min(100, Math.max(4, value * 100))}%` }} />
      </div>
    </div>
  );
}

function VoteRow({ vote, count, total }: { vote: AgentVote; count: number; total: number }) {
  const width = total ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-graphite">
        <span>{voteLabels[vote]}</span>
        <span>{count}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full bg-teal" style={{ width: `${Math.max(count ? 6 : 0, width)}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center rounded-md border border-dashed border-line bg-white text-sm font-semibold text-graphite ${compact ? "min-h-20" : "mt-4 min-h-32"}`}>
      {label}
    </div>
  );
}

function MarkdownText({ text, className }: { text: string; className?: string }) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  if (lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul className={className}>
        {lines.map((line) => (
          <li key={line}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      {lines.length ? (
        lines.map((line) => <p key={line}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</p>)
      ) : (
        <p>{renderInlineMarkdown(text)}</p>
      )}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part.replace(/\*\*/g, "");
  });
}

function buildHumanOverride(overridePoint: string): HumanOverride | null {
  const trimmedPoint = overridePoint.trim();

  if (!trimmedPoint) {
    return null;
  }

  return {
    status: "submitted",
    overrulingPoint: trimmedPoint,
    reviewerId: "demo-reviewer",
    submittedAt: new Date().toISOString()
  };
}

function getClientFinalDecision(
  result: WorkflowResult,
  humanOverride: HumanOverride | null,
  cooldownRemaining: number
) {
  if (humanOverride?.status === "submitted") {
    return `Human override submitted: ${humanOverride.overrulingPoint}`;
  }

  if (result.route.routeKind === "provisional_ai_decision" && cooldownRemaining === 0) {
    return `AI decision finalized after cooldown: ${result.provisionalDecision?.verdict.decision}`;
  }

  return result.audit.finalDecision;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildEvidenceAliases(evidenceItems: EvidenceItem[]): EvidenceAliases {
  const counts: Partial<Record<EvidenceSource, number>> = {};

  return Object.fromEntries(
    evidenceItems.map((evidence) => {
      const nextCount = (counts[evidence.source] ?? 0) + 1;
      counts[evidence.source] = nextCount;
      return [evidence.id, `${evidenceSourcePrefixes[evidence.source]}${nextCount}`];
    })
  );
}

function aliasEvidenceReferences(items: string[], evidenceAliases: EvidenceAliases) {
  return items.map((item) =>
    Object.entries(evidenceAliases).reduce((current, [canonicalId, displayId]) => {
      return current.replace(new RegExp(`\\b${escapeRegExp(canonicalId)}\\b`, "g"), displayId);
    }, item)
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueText(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function formatEvidenceList(ids: string[], evidenceAliases: EvidenceAliases) {
  if (!ids.length) {
    return "No cited evidence";
  }

  return ids.map((id) => evidenceAliases[id] ?? id).join(", ");
}

function getWorkflowStage(elapsedSeconds: number) {
  if (elapsedSeconds <= 1) {
    return {
      label: "Validating intake",
      detail: "Checking buyer, seller, policy, and evidence fields before routing."
    };
  }

  if (elapsedSeconds <= 3) {
    return {
      label: "Routing case",
      detail: "Selecting standard automation, human review, or provisional decision path."
    };
  }

  if (elapsedSeconds <= 7) {
    return {
      label: "Running jury",
      detail: "Collecting juror opinions, confidence, cited evidence, and disagreement notes."
    };
  }

  return {
    label: "Building audit",
    detail: "Preparing verdict, reviewer context, route trace, and exportable audit record."
  };
}

function getQueueMeta(caseInput: JuryCaseInput) {
  if (caseInput.sellerAgreesToReturn) {
    return {
      priority: "Routine",
      risk: "Low",
      sla: "24h",
      waiting: "12m",
      owner: "Auto",
      tone: "bg-mint text-teal"
    };
  }

  if (caseInput.id.includes("opened")) {
    return {
      priority: "High",
      risk: "Policy",
      sla: "2h",
      waiting: "48m",
      owner: "Risk",
      tone: "bg-[#fce8e6] text-coral"
    };
  }

  if (caseInput.id.includes("ambiguous")) {
    return {
      priority: "Medium",
      risk: "Low conf.",
      sla: "8h",
      waiting: "31m",
      owner: "Ops",
      tone: "bg-[#fff3d6] text-[#7a4d00]"
    };
  }

  return {
    priority: "Medium",
    risk: "Dispute",
    sla: "4h",
    waiting: "22m",
    owner: "Ops",
    tone: "bg-[#ffebe6] text-teal"
  };
}

function summarizeHistory(history: string) {
  const returnMatch = history.match(/(\d+)\s+returns?\s+across\s+(\d+)\s+orders/i);
  if (returnMatch) {
    const returns = Number(returnMatch[1]);
    const orders = Number(returnMatch[2]);
    const percentage = orders ? Math.round((returns / orders) * 100) : 0;
    return `${returns}/${orders} returns (${percentage}%)`;
  }

  const complaintMatch = history.match(/(\d+)\s+([^,.]+complaints?[^,.]*)/i);
  if (complaintMatch) {
    return `${complaintMatch[1]} ${complaintMatch[2]}`;
  }

  return "Normal recent history";
}

function getStandardAutomationDecision(caseInput: JuryCaseInput) {
  if (caseInput.sellerAgreesToReturn) {
    return {
      title: "Return/refund eligible by seller consent",
      clause: "Seller accepted the return under the platform flow.",
      reason: "Seller consent supports standard automation without jury review."
    };
  }

  return {
    title: "Return/refund eligible under 7-day policy",
    clause: "In-scope no-reason return within the return window.",
    reason: "Policy eligibility supports standard automation without jury review."
  };
}

function getRequiredHumanAction(
  result: WorkflowResult | null,
  caseInput: JuryCaseInput,
  hasUnrunChanges: boolean,
  isRunning: boolean
) {
  if (isRunning) {
    return "Wait for current workflow";
  }

  if (hasUnrunChanges) {
    return "Run workflow";
  }

  if (!result) {
    return "Run workflow";
  }

  if (result.route.routeKind === "standard_automation") {
    return getStandardAutomationDecision(caseInput).title;
  }

  if (result.route.routeKind === "human_review") {
    return "Complete final verdict and rationale";
  }

  return "Approve cooldown result or submit override";
}

function formatVoteSplit(voteSummary: Record<AgentVote, number>) {
  return [
    `${voteSummary.support_buyer ?? 0} buyer`,
    `${voteSummary.support_seller ?? 0} seller`,
    `${voteSummary.need_more_evidence ?? 0} more evidence`,
    `${voteSummary.escalate ?? 0} escalate`
  ].join(" / ");
}

function summarizeOpinion(reasoning: string) {
  const firstSentence = reasoning.split(/(?<=[.!?])\s+/)[0]?.trim();
  return firstSentence || reasoning;
}

function buildDisagreementGroups(opinions: AgentOpinion[], evidenceAliases: EvidenceAliases) {
  const factual = opinions.filter((opinion) => /missing|does not rebut|not provided|unclear/i.test(opinion.reasoning));
  const policy = opinions.filter((opinion) => /policy|eligible|restricted|SOP|manual/i.test(opinion.reasoning));
  const evidenceQuality = opinions.filter((opinion) => opinion.evidenceStrength < 0.65);
  const confidenceRisk = opinions.filter((opinion) => opinion.confidence < 0.65 || opinion.riskScore >= 0.7);
  const missingInfo = opinions.filter((opinion) => /ask|request|provide|additional/i.test(opinion.recommendation));
  const cited = Array.from(new Set(opinions.flatMap((opinion) => opinion.citedEvidenceIds))).map(
    (id) => evidenceAliases[id] ?? id
  );

  return [
    {
      title: "Factual disagreement",
      count: factual.length,
      detail: factual.length
        ? "Jurors disagree about whether the submitted facts fully prove the claim."
        : "No major factual split detected.",
      tone: factual.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    },
    {
      title: "Policy interpretation",
      count: policy.length,
      detail: policy.length
        ? "Policy fit or exclusion rules appear in juror reasoning."
        : "No policy-specific conflict detected.",
      tone: policy.length ? "bg-[#ffebe6] text-teal" : "bg-mint text-teal"
    },
    {
      title: "Evidence quality",
      count: evidenceQuality.length,
      detail: evidenceQuality.length
        ? `Evidence strength is weak or uneven. Cited IDs: ${cited.join(", ") || "none"}.`
        : "Evidence quality is sufficient for the current route.",
      tone: evidenceQuality.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    },
    {
      title: "Confidence and risk",
      count: confidenceRisk.length,
      detail: confidenceRisk.length
        ? "One or more jurors flagged low confidence or high risk."
        : "Confidence and risk are not materially split.",
      tone: confidenceRisk.length ? "bg-[#fce8e6] text-coral" : "bg-mint text-teal"
    },
    {
      title: "Missing information",
      count: missingInfo.length,
      detail: missingInfo.length
        ? "At least one juror recommends requesting more evidence before final action."
        : "No missing-information request dominates the panel.",
      tone: missingInfo.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    }
  ];
}

function formatEscalationTarget(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isReviewerAligned(systemDecision: string, reviewerVerdict: string) {
  const normalizedSystem = systemDecision.toLowerCase();

  if (reviewerVerdict === "approve_return") {
    return normalizedSystem.includes("approve") || normalizedSystem.includes("buyer");
  }

  if (reviewerVerdict === "reject_return") {
    return normalizedSystem.includes("reject") || normalizedSystem.includes("seller");
  }

  if (reviewerVerdict === "request_more_evidence") {
    return normalizedSystem.includes("evidence");
  }

  return normalizedSystem.includes("human") || normalizedSystem.includes("escalate");
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
