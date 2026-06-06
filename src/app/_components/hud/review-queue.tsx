"use client";

import { ListFilter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { getQueueMeta } from "../../_lib/workspace";

const filters = ["High disagreement", "Needs escalation", "Policy risk", "Low confidence", "New evidence"];

export function ReviewQueue({
  selectedCaseId,
  onSelectCase
}: {
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
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
        }) : (
          <p className="rounded-md border border-line bg-[#f5f5f5] p-3 text-sm text-graphite">
            No demo cases match the selected filters.
          </p>
        )}
      </div>
    </section>
  );
}
