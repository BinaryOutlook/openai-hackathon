"use client";

import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Boxes,
  Download,
  FileText,
  Gavel,
  ImagePlus,
  Loader2,
  Scale,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  support_seller: "border-cedar/30 bg-[#eee0d9] text-cedar",
  need_more_evidence: "border-amber/30 bg-[#f6e3be] text-[#76500e]",
  escalate: "border-coral/30 bg-[#f3d9d4] text-coral"
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

const routeLabels: Record<RouteKind, string> = {
  standard_automation: "Standard automation",
  human_review: "Human review",
  provisional_ai_decision: "Provisional AI decision"
};

const routeStyles: Record<RouteKind, string> = {
  standard_automation: "border-teal/30 bg-mint text-teal",
  human_review: "border-coral/30 bg-[#f3d9d4] text-coral",
  provisional_ai_decision: "border-amber/30 bg-[#f6e3be] text-[#76500e]"
};

function cloneCase(caseInput: JuryCaseInput): JuryCaseInput {
  return JSON.parse(JSON.stringify(caseInput)) as JuryCaseInput;
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

  useEffect(() => {
    void runWorkflow(cloneCase(DEMO_CASES[0]));
  }, []);

  useEffect(() => {
    if (!result?.provisionalDecision) {
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
  }, [result?.provisionalDecision?.expiresAt]);

  const evidenceSummary = useMemo(() => {
    return caseInput.evidence.reduce<Record<EvidenceItem["kind"], number>>(
      (summary, evidence) => {
        summary[evidence.kind] += 1;
        return summary;
      },
      { image: 0, text: 0, logistics: 0, policy: 0, history: 0 }
    );
  }, [caseInput.evidence]);

  async function runWorkflow(input = caseInput) {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/jury/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Workflow run failed with status ${response.status}`);
      }

      const payload = (await response.json()) as WorkflowResult;
      setResult(payload);
      setOverridePoint("");
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run workflow.");
    } finally {
      setIsRunning(false);
    }
  }

  function loadCase(caseId: string) {
    const nextCase = cloneCase(DEMO_CASES.find((demoCase) => demoCase.id === caseId) ?? DEMO_CASES[0]);
    setSelectedCaseId(caseId);
    setCaseInput(nextCase);
    void runWorkflow(nextCase);
  }

  function updateCase<K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) {
    setCaseInput((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function addEvidenceFiles(files: FileList | null, source: EvidenceSource) {
    if (!files?.length) {
      return;
    }

    const uploaded = await Promise.all(
      Array.from(files).map(async (file, index): Promise<EvidenceItem> => {
        const imageDataUrl = await fileToDataUrl(file);
        return {
          id: `U${Date.now()}-${index + 1}`,
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
  }

  function exportVerdict() {
    if (!result) {
      return;
    }

    const humanOverride = buildHumanOverride(overridePoint);
    const exportPayload = {
      case: caseInput,
      workflow: {
        ...result,
        humanOverride,
        audit: {
          ...result.audit,
          humanOverride,
          finalDecision: getClientFinalDecision(result, humanOverride, cooldownRemaining)
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
    <main className="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-paper">
                <Scale className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">AI Return Jury</h1>
                <p className="mt-1 text-sm text-graphite">Marketplace dispute operations</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill result={result} isRunning={isRunning} />
            <button
              type="button"
              onClick={() => void runWorkflow()}
              disabled={isRunning}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f5b53] disabled:cursor-not-allowed disabled:opacity-60"
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
              disabled={!result}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-3 rounded-md border border-coral/40 bg-[#f7ddd8] px-4 py-3 text-sm text-coral">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        <RoutingStrip result={result} isRunning={isRunning} cooldownRemaining={cooldownRemaining} />

        <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_380px]">
          <CaseIntake
            caseInput={caseInput}
            selectedCaseId={selectedCaseId}
            uploadSource={uploadSource}
            onSelectCase={loadCase}
            onUpdateCase={updateCase}
            onUpdateUploadSource={setUploadSource}
            onAddEvidence={addEvidenceFiles}
          />
          <EvidenceBoard caseInput={caseInput} evidenceSummary={evidenceSummary} />
          <VerdictPanel result={result} cooldownRemaining={cooldownRemaining} />
        </section>

        {result?.route.routeKind === "human_review" ? <HumanReviewPanel result={result} /> : null}

        {result?.route.routeKind === "provisional_ai_decision" ? (
          <CooldownOverridePanel
            result={result}
            cooldownRemaining={cooldownRemaining}
            overridePoint={overridePoint}
            onOverridePointChange={setOverridePoint}
          />
        ) : null}

        {result?.route.routeKind !== "standard_automation" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <JuryPanel opinions={result?.jury?.opinions ?? []} isRunning={isRunning} />
            <DeliberationPanel result={result?.jury ?? null} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function CaseIntake({
  caseInput,
  selectedCaseId,
  uploadSource,
  onSelectCase,
  onUpdateCase,
  onUpdateUploadSource,
  onAddEvidence
}: {
  caseInput: JuryCaseInput;
  selectedCaseId: string;
  uploadSource: EvidenceSource;
  onSelectCase: (caseId: string) => void;
  onUpdateCase: <K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) => void;
  onUpdateUploadSource: (source: EvidenceSource) => void;
  onAddEvidence: (files: FileList | null, source: EvidenceSource) => void;
}) {
  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Case Intake</h2>
        <Archive className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Demo case
          <select
            value={selectedCaseId}
            onChange={(event) => onSelectCase(event.target.value)}
            className="min-h-10 rounded-md border border-line bg-paper px-3 text-sm"
          >
            {DEMO_CASES.map((demoCase) => (
              <option key={demoCase.id} value={demoCase.id}>
                {demoCase.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyMetric label="Value" value={`$${caseInput.orderValue}`} />
          <ReadOnlyMetric label="Category" value={caseInput.category} />
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Request reason
          <select
            value={caseInput.requestReason}
            onChange={(event) => onUpdateCase("requestReason", event.target.value as RequestReason)}
            className="min-h-10 rounded-md border border-line bg-paper px-3 text-sm"
          >
            {Object.entries(requestReasonLabels).map(([reason, label]) => (
              <option key={reason} value={reason}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-3 rounded-md border border-line bg-paper px-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={caseInput.sellerAgreesToReturn}
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
            onChange={(event) => onUpdateCase("buyerClaim", event.target.value)}
            className="resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm leading-6"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Seller response
          <textarea
            value={caseInput.sellerResponse}
            rows={5}
            onChange={(event) => onUpdateCase("sellerResponse", event.target.value)}
            className="resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm leading-6"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Upload source
          <select
            value={uploadSource}
            onChange={(event) => onUpdateUploadSource(event.target.value as EvidenceSource)}
            className="min-h-10 rounded-md border border-line bg-paper px-3 text-sm"
          >
            {(["buyer", "seller", "reviewer", "logistics"] satisfies EvidenceSource[]).map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-teal bg-mint px-3 text-sm font-semibold text-teal transition hover:bg-[#c8e8df]">
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
  evidenceSummary
}: {
  caseInput: JuryCaseInput;
  evidenceSummary: Record<EvidenceItem["kind"], number>;
}) {
  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Evidence Board</h2>
          <p className="mt-1 text-sm text-graphite">{caseInput.productTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {Object.entries(evidenceSummary).map(([kind, count]) => (
            <span key={kind} className="rounded-md border border-line bg-paper px-2.5 py-1 capitalize text-graphite">
              {kind}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {caseInput.evidence.map((evidence) => (
          <article key={evidence.id} className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-teal">{evidence.id}</p>
                <h3 className="mt-1 text-sm font-semibold">{evidence.label}</h3>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-graphite">
                  {sourceLabels[evidence.source]}
                </span>
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold capitalize text-graphite">
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
            <p className="mt-3 text-sm leading-6 text-graphite">{evidence.summary}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBlock icon={<FileText className="h-4 w-4" />} label="Policy" value={caseInput.policyText} />
        <InfoBlock icon={<Boxes className="h-4 w-4" />} label="Logistics" value={caseInput.logisticsEvents.join(" ")} />
        <InfoBlock icon={<ShieldCheck className="h-4 w-4" />} label="History" value={`${caseInput.buyerHistory} ${caseInput.sellerHistory}`} />
      </div>
    </section>
  );
}

function RoutingStrip({
  result,
  isRunning,
  cooldownRemaining
}: {
  result: WorkflowResult | null;
  isRunning: boolean;
  cooldownRemaining: number;
}) {
  const routeKind = result?.route.routeKind;

  return (
    <section className="grid gap-3 rounded-md border border-line bg-surface p-3 shadow-soft lg:grid-cols-[1fr_1.2fr_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Route</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {routeKind ? (
            <span className={`rounded-md border px-2.5 py-1 text-sm font-semibold ${routeStyles[routeKind]}`}>
              {routeLabels[routeKind]}
            </span>
          ) : (
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 text-sm font-semibold text-graphite">
              {isRunning ? "Routing" : "Awaiting workflow"}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Reason</p>
        <p className="mt-2 text-sm leading-6 text-graphite">
          {result?.route.routingReason ?? "Run the workflow to select standard automation, human review, or provisional AI."}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-graphite">Guardrail</p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {routeKind === "standard_automation"
            ? "AI jury skipped"
            : routeKind === "human_review"
              ? "Human final call"
              : routeKind === "provisional_ai_decision"
                ? `${cooldownRemaining}s cooldown`
                : "Pending"}
        </p>
      </div>
    </section>
  );
}

function VerdictPanel({
  result,
  cooldownRemaining
}: {
  result: WorkflowResult | null;
  cooldownRemaining: number;
}) {
  const verdict = result?.provisionalDecision?.verdict ?? result?.jury?.verdict;
  const isStandardAutomation = result?.route.routeKind === "standard_automation";

  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{isStandardAutomation ? "Automation" : "Verdict"}</h2>
        {result?.route.routeKind === "human_review" || verdict?.escalate ? (
          <AlertTriangle className="h-5 w-5 text-coral" aria-hidden="true" />
        ) : (
          <BadgeCheck className="h-5 w-5 text-teal" aria-hidden="true" />
        )}
      </div>

      {isStandardAutomation ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-ink p-4 text-paper">
            <p className="text-xs font-semibold uppercase text-mint">Decision</p>
            <p className="mt-2 text-2xl font-semibold leading-tight">Standard platform automation</p>
            <p className="mt-2 text-sm text-[#d8eee7]">No AI jury was invoked for this routine return.</p>
          </div>
          <div className="rounded-md border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase text-teal">Routing reason</p>
            <p className="mt-2 text-sm leading-6 text-graphite">{result.route.routingReason}</p>
          </div>
          <ReadOnlyMetric label="Evidence IDs" value={result.audit.evidenceIds.join(", ")} />
        </div>
      ) : verdict ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-ink p-4 text-paper">
            <p className="text-xs font-semibold uppercase text-mint">Decision</p>
            <p className="mt-2 text-2xl font-semibold leading-tight">{verdict.decision}</p>
            <p className="mt-2 text-sm text-[#d8eee7]">{verdict.refundType}</p>
          </div>

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

          <div>
            <h3 className="text-sm font-semibold">Responsibility</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Object.entries(verdict.responsibility).map(([party, value]) => (
                <ReadOnlyMetric key={party} label={party} value={`${value}%`} />
              ))}
            </div>
          </div>

          {verdict.escalationReasons.length ? (
            <div className="rounded-md border border-coral/30 bg-[#f7ddd8] p-3 text-sm text-coral">
              <p className="font-semibold">Escalation Reasons</p>
              <ul className="mt-2 grid gap-1">
                {verdict.escalationReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-md border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase text-teal">Routing reason</p>
            <p className="mt-2 text-sm leading-6 text-graphite">{result?.route.routingReason}</p>
          </div>
        </div>
      ) : (
        <EmptyState label="Awaiting workflow" />
      )}
    </section>
  );
}

function HumanReviewPanel({ result }: { result: WorkflowResult }) {
  const context = result.humanReviewContext;

  return (
    <section className="rounded-md border border-coral/30 bg-[#f7ddd8] p-4 text-coral shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Human Review</h2>
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <ReviewList title="Indicators" items={context?.indicators ?? result.route.indicators} />
        <ReviewList title="Warnings" items={context?.warnings ?? result.route.warnings} />
        <ReviewList title="Review Focus" items={context?.suggestedReviewFocus ?? []} />
      </div>
    </section>
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
    <section className="rounded-md border border-amber/40 bg-[#f6e3be] p-4 text-[#76500e] shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Cooldown Override</h2>
        <span className="rounded-md border border-amber/40 bg-paper px-2.5 py-1 text-sm font-semibold">
          {overrideCaptured
            ? "Override captured"
            : cooldownRemaining > 0
              ? `${cooldownRemaining}s remaining`
              : "AI final after cooldown"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-md border border-amber/30 bg-paper p-3">
          <p className="text-xs font-semibold uppercase">Provisional decision</p>
          <p className="mt-2 text-sm leading-6">{result.provisionalDecision?.verdict.decision}</p>
          <p className="mt-2 text-xs font-semibold">
            Expires at {result.provisionalDecision?.expiresAt}
          </p>
        </div>
        <label className="grid gap-1 text-sm font-medium">
          Human overruling point
          <textarea
            value={overridePoint}
            rows={4}
            onChange={(event) => onOverridePointChange(event.target.value)}
            className="resize-none rounded-md border border-amber/40 bg-paper px-3 py-2 text-sm leading-6 text-ink"
            placeholder="Record why a reviewer overruled the provisional AI decision."
          />
        </label>
      </div>
    </section>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-coral/30 bg-paper p-3">
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

function JuryPanel({ opinions, isRunning }: { opinions: AgentOpinion[]; isRunning: boolean }) {
  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Jury Panel</h2>
        <Sparkles className="h-5 w-5 text-amber" aria-hidden="true" />
      </div>

      {opinions.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {opinions.map((opinion) => (
            <article key={opinion.agentId} className="rounded-md border border-line bg-paper p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{opinion.agentName}</h3>
                  <p className="mt-1 text-xs text-graphite">Confidence {formatPercent(opinion.confidence)}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${voteStyles[opinion.vote]}`}>
                  {voteLabels[opinion.vote]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-graphite">{opinion.reasoning}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opinion.citedEvidenceIds.map((id) => (
                  <span key={id} className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-teal">
                    {id}
                  </span>
                ))}
              </div>
              {opinion.riskFlags.length ? (
                <p className="mt-3 text-xs font-medium text-coral">{opinion.riskFlags.join(" ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label={isRunning ? "Jury running" : "No opinions yet"} />
      )}
    </section>
  );
}

function DeliberationPanel({ result }: { result: WorkflowResult["jury"] }) {
  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Deliberation</h2>
        <Gavel className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      {result ? (
        <div className="mt-4 grid gap-4">
          <p className="text-sm leading-6 text-graphite">{result.deliberation}</p>
          <div>
            <h3 className="text-sm font-semibold">Recommended Actions</h3>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-graphite">
              {result.verdict.recommendedActions.map((action) => (
                <li key={action} className="rounded-md border border-line bg-paper px-3 py-2">
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase text-teal">Rationale</p>
            <p className="mt-2 text-sm leading-6 text-graphite">{result.verdict.rationale}</p>
          </div>
        </div>
      ) : (
        <EmptyState label="Awaiting deliberation" />
      )}
    </section>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-16 rounded-md border border-line bg-paper px-3 py-2">
      <p className="text-xs font-semibold uppercase text-graphite">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</p>
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-md border border-line bg-paper p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-teal">{icon}</span>
        {label}
      </div>
      <p className="mt-2 line-clamp-5 text-sm leading-6 text-graphite">{value}</p>
    </article>
  );
}

function StatusPill({ result, isRunning }: { result: WorkflowResult | null; isRunning: boolean }) {
  if (isRunning) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber/30 bg-[#f6e3be] px-3 text-sm font-semibold text-[#76500e]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Running
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-graphite">
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="mt-4 flex min-h-32 items-center justify-center rounded-md border border-dashed border-line bg-paper text-sm font-semibold text-graphite">
      {label}
    </div>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
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
