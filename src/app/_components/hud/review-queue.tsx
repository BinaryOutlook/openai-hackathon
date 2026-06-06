"use client";

import { ChevronDown, ListFilter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import {
  getQueueMeta,
  queueStatusLabels,
  queueStatusStyles,
  type QueueCaseStatus
} from "../../_lib/workspace";

const filters = ["High disagreement", "Needs escalation", "Policy risk", "Low confidence", "New evidence"];

export function ReviewQueue({
  selectedCaseId,
  caseStatuses,
  onSelectCase
}: {
  selectedCaseId: string;
  caseStatuses: Record<string, QueueCaseStatus>;
  onSelectCase: (caseId: string) => void;
}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleCases = useMemo(() => {
    if (!activeFilters.length) {
      return DEMO_CASES;
    }

    return DEMO_CASES.filter((demoCase) => {
      const meta = getQueueMeta(demoCase);
      return activeFilters.some((filter) => meta.filters.includes(filter));
    });
  }, [activeFilters]);

  useEffect(() => {
    if (!activeFilters.length || !visibleCases.length || visibleCases.some((demoCase) => demoCase.id === selectedCaseId)) {
      return;
    }

    onSelectCase(visibleCases[0].id);
  }, [activeFilters.length, onSelectCase, selectedCaseId, visibleCases]);

  function toggleFilter(filter: string) {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]
    );
  }

  const selectedIndex = Math.max(0, DEMO_CASES.findIndex((demoCase) => demoCase.id === selectedCaseId));
  const selectedCase = DEMO_CASES[selectedIndex] ?? DEMO_CASES[0];
  const statusCounts = DEMO_CASES.reduce<Record<QueueCaseStatus, number>>(
    (counts, demoCase) => {
      counts[caseStatuses[demoCase.id] ?? "pending"] += 1;
      return counts;
    },
    { pending: 0, done: 0, archived: 0 }
  );
  const selectedStatus = caseStatuses[selectedCase.id] ?? "pending";

  return (
    <section className="relative z-30">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="review-queue-menu"
        onClick={() => setIsExpanded((current) => !current)}
        className="grid w-full min-h-16 gap-3 rounded-md border border-line bg-white p-3 text-left shadow-soft transition hover:border-teal hover:bg-[#fff7f4] lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#fff7f4] text-teal">
            <ListFilter className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-graphite">Queue</p>
            <p className="truncate text-sm font-semibold text-ink">
              {selectedIndex + 1}/{DEMO_CASES.length} · {selectedCase.title}
            </p>
            <p className="mt-1 text-xs font-medium text-graphite">
              {queueStatusLabels[selectedStatus]} · Pending no decision, Done cooldown/handoff, Archived closed
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-graphite lg:justify-end">
          <span
            title="Done: cooldown active, cooldown handled, or supervisor handoff."
            className="rounded-md border border-line bg-[#f5f5f5] px-2.5 py-1"
          >
            Done {statusCounts.done}
          </span>
          <span
            title="Pending: no final reviewer action yet."
            className="rounded-md border border-line bg-[#f5f5f5] px-2.5 py-1"
          >
            Pending {statusCounts.pending}
          </span>
          <span
            title="Archived: submitted and fully closed."
            className="rounded-md border border-line bg-[#f5f5f5] px-2.5 py-1"
          >
            Archived {statusCounts.archived}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-teal transition ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded ? (
        <div
          id="review-queue-menu"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[70vh] overflow-y-auto rounded-md border border-line bg-white p-4 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Review Queue</h2>
              <p className="mt-1 text-xs text-graphite">
                Pending needs a decision. Done is cooldown or supervisor handoff. Archived is closed.
              </p>
            </div>
            <ListFilter className="h-5 w-5 text-teal" aria-hidden="true" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={activeFilters.includes(filter)}
                onClick={() => toggleFilter(filter)}
                className={`min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  activeFilters.includes(filter)
                    ? "border-teal bg-[#fff7f4] text-teal shadow-brand"
                    : "border-line bg-[#f5f5f5] text-graphite hover:border-teal hover:bg-[#fff7f4] hover:text-teal"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-2 pr-1">
            {visibleCases.length ? visibleCases.map((demoCase) => {
              const meta = getQueueMeta(demoCase);
              const selected = demoCase.id === selectedCaseId;
              const status = caseStatuses[demoCase.id] ?? "pending";
              return (
                <button
                  key={demoCase.id}
                  type="button"
                  onClick={() => {
                    onSelectCase(demoCase.id);
                    setIsExpanded(false);
                  }}
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
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.tone}`}>
                        {meta.priority}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${queueStatusStyles[status]}`}>
                        {queueStatusLabels[status]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-graphite">
                    <span>Risk: {meta.risk}</span>
                    <span>SLA: {meta.sla}</span>
                    <span>Waiting: {meta.waiting}</span>
                    <span>Owner: {meta.owner}</span>
                  </div>
                </button>
              );
            }) : (
              <p className="rounded-md border border-line bg-[#f5f5f5] p-3 text-sm text-graphite">
                No demo cases match the selected filters.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
