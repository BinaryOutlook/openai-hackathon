import { Archive, Clock3, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { EvidenceItem, JuryCaseInput } from "@/types/jury";
import { EmptyState, MarkdownText } from "../ui";
import { sourceLabels, summarizeHistory, type EvidenceAliases } from "../../_lib/workspace";

export function EvidenceBoard({
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
    <section className="rounded-md border border-line bg-white p-4 shadow-soft xl:max-h-[max(24rem,calc(100vh-32rem))] xl:overflow-y-auto">
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
    <div className="min-w-0 rounded-md border border-line bg-[#f5f5f5] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-teal">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-graphite">{subtitle}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-md bg-white p-2 text-xs leading-5 text-graphite [overflow-wrap:anywhere]">{context}</p>
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
    <div className="min-w-0 rounded-md border border-teal/20 bg-[#fff7f4] p-3">
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
    <article className="min-w-0 rounded-md border border-line bg-white p-3">
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
          loading="lazy"
          decoding="async"
          className="mt-3 aspect-[16/10] w-full rounded-md border border-line object-cover"
        />
      ) : null}
      <MarkdownText className="mt-3 text-sm leading-6 text-graphite [overflow-wrap:anywhere]" text={evidence.summary} />
    </article>
  );
}
