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
import type { AgentOpinion, AgentVote, EvidenceItem, JuryCaseInput, JuryRunResult } from "@/types/jury";

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

function cloneCase(caseInput: JuryCaseInput): JuryCaseInput {
  return JSON.parse(JSON.stringify(caseInput)) as JuryCaseInput;
}

export default function Home() {
  const [caseInput, setCaseInput] = useState<JuryCaseInput>(() => cloneCase(DEMO_CASES[0]));
  const [selectedCaseId, setSelectedCaseId] = useState(DEMO_CASES[0].id);
  const [result, setResult] = useState<JuryRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void runJury(cloneCase(DEMO_CASES[0]));
  }, []);

  const evidenceSummary = useMemo(() => {
    return caseInput.evidence.reduce<Record<EvidenceItem["kind"], number>>(
      (summary, evidence) => {
        summary[evidence.kind] += 1;
        return summary;
      },
      { image: 0, text: 0, logistics: 0, policy: 0, history: 0 }
    );
  }, [caseInput.evidence]);

  async function runJury(input = caseInput) {
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
        throw new Error(`Jury run failed with status ${response.status}`);
      }

      const payload = (await response.json()) as JuryRunResult;
      setResult(payload);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run jury.");
    } finally {
      setIsRunning(false);
    }
  }

  function loadCase(caseId: string) {
    const nextCase = cloneCase(DEMO_CASES.find((demoCase) => demoCase.id === caseId) ?? DEMO_CASES[0]);
    setSelectedCaseId(caseId);
    setCaseInput(nextCase);
    void runJury(nextCase);
  }

  function updateCase<K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) {
    setCaseInput((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function addEvidenceFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const uploaded = await Promise.all(
      Array.from(files).map(async (file, index): Promise<EvidenceItem> => {
        const imageDataUrl = await fileToDataUrl(file);
        return {
          id: `U${Date.now()}-${index + 1}`,
          label: file.name,
          kind: "image",
          summary: "Uploaded buyer, seller, or reviewer evidence image.",
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

    const blob = new Blob([JSON.stringify({ case: caseInput, ...result }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${caseInput.id}-jury-verdict.json`;
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
              onClick={() => void runJury()}
              disabled={isRunning}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f5b53] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Gavel className="h-4 w-4" aria-hidden="true" />
              )}
              Run jury
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

        <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_380px]">
          <CaseIntake
            caseInput={caseInput}
            selectedCaseId={selectedCaseId}
            onSelectCase={loadCase}
            onUpdateCase={updateCase}
            onAddEvidence={addEvidenceFiles}
          />
          <EvidenceBoard caseInput={caseInput} evidenceSummary={evidenceSummary} />
          <VerdictPanel result={result} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <JuryPanel opinions={result?.opinions ?? []} isRunning={isRunning} />
          <DeliberationPanel result={result} />
        </section>
      </div>
    </main>
  );
}

function CaseIntake({
  caseInput,
  selectedCaseId,
  onSelectCase,
  onUpdateCase,
  onAddEvidence
}: {
  caseInput: JuryCaseInput;
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onUpdateCase: <K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) => void;
  onAddEvidence: (files: FileList | null) => void;
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

        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-teal bg-mint px-3 text-sm font-semibold text-teal transition hover:bg-[#c8e8df]">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Add image evidence
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void onAddEvidence(event.target.files)}
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
              <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold capitalize text-graphite">
                {evidence.kind}
              </span>
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

function VerdictPanel({ result }: { result: JuryRunResult | null }) {
  const verdict = result?.verdict;

  return (
    <section className="rounded-md border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Verdict</h2>
        {verdict?.escalate ? (
          <AlertTriangle className="h-5 w-5 text-coral" aria-hidden="true" />
        ) : (
          <BadgeCheck className="h-5 w-5 text-teal" aria-hidden="true" />
        )}
      </div>

      {verdict ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-ink p-4 text-paper">
            <p className="text-xs font-semibold uppercase text-mint">Decision</p>
            <p className="mt-2 text-2xl font-semibold leading-tight">{verdict.decision}</p>
            <p className="mt-2 text-sm text-[#d8eee7]">{verdict.refundType}</p>
          </div>

          <MetricBar
            label="Overall confidence"
            value={verdict.overallConfidence}
            tone={verdict.overallConfidence >= 0.65 ? "teal" : "amber"}
          />
          <MetricBar label="Risk score" value={verdict.riskScore} tone={verdict.riskScore >= 0.7 ? "coral" : "cedar"} />

          <div>
            <h3 className="text-sm font-semibold">Vote Split</h3>
            <div className="mt-2 grid gap-2">
              {Object.entries(verdict.voteSummary).map(([vote, count]) => (
                <VoteRow key={vote} vote={vote as AgentVote} count={count} total={result?.opinions.length ?? 7} />
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
        </div>
      ) : (
        <EmptyState label="Awaiting jury" />
      )}
    </section>
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

function DeliberationPanel({ result }: { result: JuryRunResult | null }) {
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

function StatusPill({ result, isRunning }: { result: JuryRunResult | null; isRunning: boolean }) {
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
      {result?.mode === "live" ? "Live model" : "Demo jury"}
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
        <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.max(4, value * 100)}%` }} />
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
