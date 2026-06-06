import { ListFilter } from "lucide-react";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { getQueueMeta } from "../../_lib/workspace";

export function ReviewQueue({
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

      <div className="mt-4 grid max-h-[360px] gap-2 overflow-y-auto pr-1">
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
