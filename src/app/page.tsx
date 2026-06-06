"use client";

import { AlertTriangle, Download, Gavel, Loader2, Scale, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { runMockJury } from "@/lib/jury/mock";
import { selectRoute } from "@/lib/jury/routing";
import { DEBATE_TURN_REVEAL_INTERVAL_MS } from "@/lib/jury/timing";
import type {
  EvidenceItem,
  EvidenceSource,
  JuryCaseInput,
  JuryRunResult,
  RouteKind,
  WorkflowResult
} from "@/types/jury";
import { AgentChatroomPanel, DeliberationPanel, RouteAuditPanel, SimilarPastCases } from "./_components/ai-jury";
import {
  CaseIntake,
  CooldownOverridePanel,
  EvidenceBoard,
  HumanReviewPanel,
  ReviewActionStrip,
  ReviewQueue,
  VerdictPanel,
  WorkflowProgress
} from "./_components/hud";
import { StatusPill } from "./_components/ui";
import { WorkspaceTabs } from "./_components/workspace-tabs";
import {
  buildDefaultReviewerDecision,
  buildEvidenceAliases,
  buildHumanOverride,
  buildReviewerDecisionRecord,
  cloneCase,
  evidenceSourcePrefixes,
  fileToDataUrl,
  formatReviewerVerdict,
  getClientFinalDecision,
  getExportValidation,
  getSimilarPastCases,
  sourceLabels,
  type QueueCaseStatus,
  type ReviewerDecision,
  type WorkspaceView
} from "./_lib/workspace";

const COOLDOWN_EXTENSION_MS = 10 * 60 * 1000;

// UX_NOTE: The client-side preview makes the AI Jury tab feel alive while the authoritative API result is still running.
function buildClientPreviewJury(caseInput: JuryCaseInput): {
  jury: JuryRunResult | null;
  routeKind: RouteKind;
} {
  const decidedAt = new Date().toISOString();
  const firstRoute = selectRoute({ caseInput, decidedAt });

  if (!firstRoute.requiresJury) {
    return {
      jury: null,
      routeKind: firstRoute.routeKind
    };
  }

  const jury = runMockJury(caseInput);
  const finalRoute = selectRoute({ caseInput, juryResult: jury, decidedAt });

  return {
    jury,
    routeKind: finalRoute.routeKind
  };
}

function buildInitialQueueStatuses() {
  return Object.fromEntries(DEMO_CASES.map((demoCase) => [demoCase.id, "pending"])) as Record<
    string,
    QueueCaseStatus
  >;
}

function getWorkflowQueueStatus(workflowResult: WorkflowResult): QueueCaseStatus {
  if (workflowResult.route.routeKind === "standard_automation") {
    return "archived";
  }

  if (workflowResult.route.routeKind === "provisional_ai_decision") {
    return "done";
  }

  return "pending";
}

export default function Home() {
  const [caseInput, setCaseInput] = useState<JuryCaseInput>(() => cloneCase(DEMO_CASES[0]));
  const [selectedCaseId, setSelectedCaseId] = useState(DEMO_CASES[0].id);
  const [caseStatuses, setCaseStatuses] = useState<Record<string, QueueCaseStatus>>(buildInitialQueueStatuses);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [uploadSource, setUploadSource] = useState<EvidenceSource>("buyer");
  const [overridePoint, setOverridePoint] = useState("");
  const [cooldownExpiresAtOverride, setCooldownExpiresAtOverride] = useState<string | null>(null);
  const [cooldownRemarkSavedAt, setCooldownRemarkSavedAt] = useState("");
  const [manualHumanReviewCaseIds, setManualHumanReviewCaseIds] = useState<Record<string, true>>({});
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaseEditable, setIsCaseEditable] = useState(false);
  const [hasUnrunChanges, setHasUnrunChanges] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressiveJury, setProgressiveJury] = useState<JuryRunResult | null>(null);
  const [progressiveRouteKind, setProgressiveRouteKind] = useState<RouteKind | undefined>();
  const [visibleDebateTurnCount, setVisibleDebateTurnCount] = useState(0);
  const [activeView, setActiveView] = useState<WorkspaceView>("hud");
  const [reviewerDecision, setReviewerDecision] = useState<ReviewerDecision>(() =>
    buildDefaultReviewerDecision(DEMO_CASES[0])
  );
  const [savedDraftAt, setSavedDraftAt] = useState("");
  const debateRevealTarget = result?.jury ?? progressiveJury;

  // UX_NOTE: The initial run gives judges an immediate populated workspace instead of an empty landing screen.
  useEffect(() => {
    void runWorkflow(cloneCase(DEMO_CASES[0]));
  }, []);

  useEffect(() => {
    if (!result?.provisionalDecision || hasUnrunChanges || isRunning) {
      setCooldownRemaining(0);
      return;
    }

    const expiresAt = cooldownExpiresAtOverride ?? result.provisionalDecision.expiresAt;
    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)
      );
      setCooldownRemaining(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownExpiresAtOverride, hasUnrunChanges, isRunning, result?.provisionalDecision?.expiresAt]);

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

  useEffect(() => {
    if (!debateRevealTarget || visibleDebateTurnCount === 0) {
      return;
    }

    const totalTurns = debateRevealTarget.debateTurns.length;

    if (visibleDebateTurnCount >= totalTurns) {
      return;
    }

    setVisibleDebateTurnCount((current) => Math.max(1, Math.min(current || 1, totalTurns)));

    const timer = window.setInterval(() => {
      setVisibleDebateTurnCount((current) => Math.min(current + 1, totalTurns));
    }, DEBATE_TURN_REVEAL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [debateRevealTarget, visibleDebateTurnCount]);

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
  const similarCases = useMemo(() => getSimilarPastCases(caseInput), [caseInput]);
  const displayedResult = isRunning || hasUnrunChanges ? null : result;
  const manualHumanReviewActive = Boolean(
    displayedResult?.route.routeKind === "provisional_ai_decision" && manualHumanReviewCaseIds[selectedCaseId]
  );
  const requiresHumanClosure = Boolean(displayedResult?.route.routeKind === "human_review" || manualHumanReviewActive);
  const selectedCaseStatus = caseStatuses[selectedCaseId] ?? "pending";
  const effectiveCooldownExpiresAt = displayedResult?.provisionalDecision
    ? cooldownExpiresAtOverride ?? displayedResult.provisionalDecision.expiresAt
    : null;
  const displayedJury = displayedResult?.jury ?? (isRunning ? progressiveJury : null);
  const displayedRouteKind = displayedResult?.route.routeKind ?? (isRunning ? progressiveRouteKind : undefined);
  const isDebateRevealing = Boolean(
    displayedJury &&
      visibleDebateTurnCount > 0 &&
      visibleDebateTurnCount < displayedJury.debateTurns.length
  );
  const exportValidation = useMemo(
    () => getExportValidation(displayedResult, caseInput, reviewerDecision, requiresHumanClosure),
    [caseInput, displayedResult, requiresHumanClosure, reviewerDecision]
  );

  async function runWorkflow(input = caseInput) {
    const inputSnapshot = cloneCase(input);
    const preview = buildClientPreviewJury(inputSnapshot);

    setIsRunning(true);
    setError(null);
    setResult(null);
    setCooldownRemaining(0);
    setCooldownExpiresAtOverride(null);
    setCooldownRemarkSavedAt("");
    setElapsedSeconds(0);
    setRunStartedAt(Date.now());
    setHasUnrunChanges(false);
    setManualHumanReviewCaseIds((current) => {
      const next = { ...current };
      delete next[inputSnapshot.id];
      return next;
    });
    setProgressiveRouteKind(preview.routeKind);
    setProgressiveJury(preview.jury);
    setVisibleDebateTurnCount(preview.jury ? 1 : 0);

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
      setCaseStatuses((current) => ({
        ...current,
        [inputSnapshot.id]: getWorkflowQueueStatus(payload)
      }));
      setOverridePoint("");
      setReviewerDecision(buildDefaultReviewerDecision(inputSnapshot));
      setSavedDraftAt("");
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run workflow.");
      setVisibleDebateTurnCount(0);
    } finally {
      setIsRunning(false);
      setRunStartedAt(null);
      setProgressiveJury(null);
      setProgressiveRouteKind(undefined);
    }
  }

  function loadCase(caseId: string) {
    const nextCase = cloneCase(DEMO_CASES.find((demoCase) => demoCase.id === caseId) ?? DEMO_CASES[0]);
    setSelectedCaseId(caseId);
    setCaseInput(nextCase);
    setIsCaseEditable(false);
    setReviewerDecision(buildDefaultReviewerDecision(nextCase));
    setSavedDraftAt("");
    setOverridePoint("");
    setCooldownExpiresAtOverride(null);
    setCooldownRemarkSavedAt("");
    setHasUnrunChanges(false);
    void runWorkflow(nextCase);
  }

  function markInputChanged() {
    setHasUnrunChanges(true);
    setResult(null);
    setCooldownRemaining(0);
    setCooldownExpiresAtOverride(null);
    setCooldownRemarkSavedAt("");
    setProgressiveJury(null);
    setProgressiveRouteKind(undefined);
    setVisibleDebateTurnCount(0);
    setManualHumanReviewCaseIds((current) => {
      const next = { ...current };
      delete next[caseInput.id];
      return next;
    });
    setCaseStatuses((current) => ({
      ...current,
      [caseInput.id]: "pending"
    }));
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

    try {
      setError(null);
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
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload evidence image.");
    }
  }

  function updateReviewerDecision<K extends keyof ReviewerDecision>(key: K, value: ReviewerDecision[K]) {
    setReviewerDecision((current) => ({
      ...current,
      [key]: value,
      updatedAt: new Date().toISOString()
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

  function markSelectedCaseStatus(status: QueueCaseStatus) {
    setCaseStatuses((current) => ({
      ...current,
      [selectedCaseId]: status
    }));
  }

  function saveCooldownRemark() {
    if (!overridePoint.trim()) {
      setError("Add a cooldown remark before saving it.");
      return;
    }

    setError(null);
    setCooldownRemarkSavedAt(new Date().toISOString());
    markSelectedCaseStatus("done");
  }

  function extendCooldown() {
    if (!displayedResult?.provisionalDecision) {
      return;
    }

    const currentExpiry = Date.parse(effectiveCooldownExpiresAt ?? displayedResult.provisionalDecision.expiresAt);
    const nextExpiry = new Date(Math.max(Date.now(), currentExpiry) + COOLDOWN_EXTENSION_MS).toISOString();
    setCooldownExpiresAtOverride(nextExpiry);
    markSelectedCaseStatus("done");
  }

  function overruleCooldown() {
    if (!displayedResult?.provisionalDecision) {
      return;
    }

    const timestamp = new Date().toISOString();
    setManualHumanReviewCaseIds((current) => ({
      ...current,
      [selectedCaseId]: true
    }));
    markSelectedCaseStatus("pending");
    setReviewerDecision((current) => ({
      ...current,
      overrideReason: current.overrideReason || overridePoint.trim(),
      notes: current.notes || "Overruled from provisional AI cooldown.",
      updatedAt: timestamp
    }));
    setActiveView("human-review");
  }

  function escalateSupervisor() {
    const timestamp = new Date().toISOString();
    setReviewerDecision((current) => ({
      ...current,
      finalVerdict: "escalate",
      reason: current.reason.trim() || "Escalated to supervisor for final operational review.",
      updatedAt: timestamp
    }));
    setSavedDraftAt(timestamp);
    markSelectedCaseStatus("done");
    setError(null);
  }

  function submitHumanReview() {
    if (!displayedResult || !exportValidation.canExport) {
      setError(exportValidation.reason);
      return;
    }

    const timestamp = new Date().toISOString();
    setSavedDraftAt(timestamp);
    markSelectedCaseStatus("archived");
    setError(null);
  }

  // AUDIT_NOTE: Export bundles case input, reviewer action, workflow route, human override, and final decision into one reviewable JSON.
  function exportVerdict() {
    if (!displayedResult || !exportValidation.canExport) {
      setError(exportValidation.reason);
      return;
    }

    const humanOverride = buildHumanOverride(
      manualHumanReviewActive ? reviewerDecision.overrideReason || overridePoint : overridePoint
    );
    const exportedAt = new Date().toISOString();
    const reviewerDecisionRecord = buildReviewerDecisionRecord({
      caseInput,
      reviewerDecision,
      result: displayedResult,
      evidenceAliases,
      similarCases,
      timestamp: reviewerDecision.updatedAt || exportedAt
    });
    const exportPayload = {
      case: caseInput,
      reviewerDecision: reviewerDecisionRecord,
      workflow: {
        ...displayedResult,
        humanOverride,
        audit: {
          ...displayedResult.audit,
          humanOverride,
          reviewerDecision: reviewerDecisionRecord,
          finalDecision: requiresHumanClosure && reviewerDecision.finalVerdict
            ? `Human review submitted: ${formatReviewerVerdict(reviewerDecision.finalVerdict)}`
            : getClientFinalDecision(displayedResult, humanOverride, cooldownRemaining)
        }
      },
      exportedAt
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
      <div className="mx-auto flex max-w-[1880px] flex-col gap-4">
        <header className="grid gap-3 border-b border-line pb-4 lg:grid-cols-[minmax(260px,auto)_minmax(380px,1fr)_auto] lg:items-start">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal text-white shadow-brand">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-medium leading-tight sm:text-3xl">AI Return Jury</h1>
              <p className="mt-1 text-sm text-graphite">Shrimp marketplace dispute operations</p>
            </div>
          </div>

          <ReviewQueue selectedCaseId={selectedCaseId} caseStatuses={caseStatuses} onSelectCase={loadCase} />

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                result={displayedResult}
                isRunning={isRunning}
                hasUnrunChanges={hasUnrunChanges}
                elapsedSeconds={elapsedSeconds}
              />
              {hasUnrunChanges ? (
                <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber/30 bg-[#fff3d6] px-3 text-sm font-semibold text-[#7a4d00]">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Changes made
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void runWorkflow()}
                disabled={isRunning}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a62f08] disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={!exportValidation.canExport}
                title={exportValidation.reason}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
              </button>
            </div>
            {requiresHumanClosure && !exportValidation.canExport ? (
              <p className="text-xs font-semibold text-coral">{exportValidation.reason}</p>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-3 rounded-md border border-coral/40 bg-[#fce8e6] px-4 py-3 text-sm text-coral">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        <WorkspaceTabs
          activeView={activeView}
          onChange={setActiveView}
          result={displayedResult}
          isRunning={isRunning}
          hasUnrunChanges={hasUnrunChanges}
          elapsedSeconds={elapsedSeconds}
          forceHumanReview={manualHumanReviewActive}
        />

        <div
          id={`workspace-panel-${activeView}`}
          role="tabpanel"
          aria-labelledby={`workspace-tab-${activeView}`}
          tabIndex={0}
          className="focus:outline-none"
        >
          {activeView === "hud" ? (
            <>
            <ReviewActionStrip
              caseInput={caseInput}
              result={displayedResult}
              isRunning={isRunning}
              hasUnrunChanges={hasUnrunChanges}
              elapsedSeconds={elapsedSeconds}
              forceHumanReview={manualHumanReviewActive}
              onOpenHumanReview={() => setActiveView("human-review")}
            />

            {displayedResult?.route.routeKind === "provisional_ai_decision" && !manualHumanReviewActive ? (
              <CooldownOverridePanel
                result={displayedResult}
                cooldownRemaining={cooldownRemaining}
                cooldownExpiresAt={effectiveCooldownExpiresAt}
                overridePoint={overridePoint}
                remarkSavedAt={cooldownRemarkSavedAt}
                onOverridePointChange={setOverridePoint}
                onAddRemark={saveCooldownRemark}
                onExtendCooldown={extendCooldown}
                onOverrule={overruleCooldown}
              />
            ) : null}

            <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_360px] 2xl:grid-cols-[360px_minmax(0,1.35fr)_400px]">
              <div className="grid gap-4 xl:self-start">
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
              <div className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
                <VerdictPanel
                  caseInput={caseInput}
                  result={displayedResult}
                  isRunning={isRunning}
                  hasUnrunChanges={hasUnrunChanges}
                  cooldownRemaining={cooldownRemaining}
                  evidenceAliases={evidenceAliases}
                />
                </div>
              </section>
            </>
          ) : activeView === "human-review" ? (
            <>
              <WorkflowProgress
                result={displayedResult}
                isRunning={isRunning}
                hasUnrunChanges={hasUnrunChanges}
                elapsedSeconds={elapsedSeconds}
                forceHumanReview={manualHumanReviewActive}
              />

              {displayedResult && requiresHumanClosure ? (
                <HumanReviewPanel
                  result={displayedResult}
                  caseInput={caseInput}
                  evidenceAliases={evidenceAliases}
                  reviewerDecision={reviewerDecision}
                  exportStatus={exportValidation}
                  savedDraftAt={savedDraftAt}
                  similarCases={similarCases}
                  caseStatus={selectedCaseStatus}
                  onDecisionChange={updateReviewerDecision}
                  onToggleEvidence={toggleReviewerEvidence}
                  onSaveDraft={() => setSavedDraftAt(new Date().toISOString())}
                  onEscalateSupervisor={escalateSupervisor}
                  onSubmitCase={submitHumanReview}
                />
              ) : displayedResult?.route.routeKind === "provisional_ai_decision" ? (
                <CooldownOverridePanel
                  result={displayedResult}
                  cooldownRemaining={cooldownRemaining}
                  cooldownExpiresAt={effectiveCooldownExpiresAt}
                  overridePoint={overridePoint}
                  remarkSavedAt={cooldownRemarkSavedAt}
                  onOverridePointChange={setOverridePoint}
                  onAddRemark={saveCooldownRemark}
                  onExtendCooldown={extendCooldown}
                  onOverrule={overruleCooldown}
                />
              ) : (
                <section className="rounded-md border border-line bg-white p-4 shadow-soft">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal" aria-hidden="true" />
                    <h2 className="text-base font-semibold">Human Review</h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-graphite">
                    {isRunning || hasUnrunChanges
                      ? "Run workflow to refresh the review path."
                      : "No human final decision is required for this route."}
                  </p>
                </section>
              )}
            </>
          ) : (
            <>
            <WorkflowProgress
              result={displayedResult}
              isRunning={isRunning}
              hasUnrunChanges={hasUnrunChanges}
              elapsedSeconds={elapsedSeconds}
            />

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_420px] 2xl:grid-cols-[minmax(0,1.45fr)_460px]">
              <div className="grid gap-4">
                {displayedResult ? (
                  <DeliberationPanel
                    result={displayedResult.jury}
                    routeKind={displayedResult.route.routeKind}
                    caseInput={caseInput}
                    evidenceAliases={evidenceAliases}
                  />
                ) : null}
                <AgentChatroomPanel
                  result={displayedJury}
                  isRunning={isRunning}
                  isPreview={isRunning}
                  isRevealing={isDebateRevealing}
                  routeKind={displayedRouteKind}
                  evidenceAliases={evidenceAliases}
                  visibleTurnCount={visibleDebateTurnCount || undefined}
                />
              </div>
              <div className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
                <RouteAuditPanel
                  caseInput={caseInput}
                  result={displayedResult}
                  isRunning={isRunning}
                  hasUnrunChanges={hasUnrunChanges}
                  cooldownRemaining={cooldownRemaining}
                  evidenceAliases={evidenceAliases}
                />
                <SimilarPastCases caseInput={caseInput} similarCases={similarCases} />
              </div>
            </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
