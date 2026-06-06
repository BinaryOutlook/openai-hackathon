import { Loader2, ShieldCheck, TimerReset } from "lucide-react";
import type { AgentVote, WorkflowResult } from "@/types/jury";
import {
  formatPercent,
  getWorkflowStage,
  routeLabels,
  uniqueText,
  voteLabels
} from "../_lib/workspace";

export function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-coral/30 bg-white p-3">
      <p className="text-xs font-semibold uppercase">{title}</p>
      {items.length ? (
        <ul className="mt-2 grid max-h-44 gap-2 overflow-y-auto pr-1 text-sm leading-6">
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

export function RiskPanel({ result }: { result: WorkflowResult | null }) {
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

export function PendingComputedSection({
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

export function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-16 rounded-md border border-line bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase text-graphite">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</p>
    </div>
  );
}

export function StatusPill({
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

export function MetricBar({ label, value, tone }: { label: string; value: number; tone: "teal" | "amber" | "coral" | "cedar" }) {
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

export function VoteRow({ vote, count, total }: { vote: AgentVote; count: number; total: number }) {
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

export function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center rounded-md border border-dashed border-line bg-white text-sm font-semibold text-graphite ${compact ? "min-h-20" : "mt-4 min-h-32"}`}>
      {label}
    </div>
  );
}

export function MarkdownText({ text, className }: { text: string; className?: string }) {
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
