import { Clock3, MessageSquarePlus, Undo2 } from "lucide-react";
import type { WorkflowResult } from "@/types/jury";

const remarkBank = [
  "Need supervisor visibility before AI decision finalizes.",
  "Buyer evidence appears stronger than seller rebuttal.",
  "Check logistics handoff before accepting AI final decision."
];

export function CooldownOverridePanel({
  result,
  cooldownRemaining,
  cooldownExpiresAt,
  overridePoint,
  remarkSavedAt,
  onOverridePointChange,
  onAddRemark,
  onExtendCooldown,
  onOverrule
}: {
  result: WorkflowResult;
  cooldownRemaining: number;
  cooldownExpiresAt: string | null;
  overridePoint: string;
  remarkSavedAt: string;
  onOverridePointChange: (value: string) => void;
  onAddRemark: () => void;
  onExtendCooldown: () => void;
  onOverrule: () => void;
}) {
  const overrideCaptured = overridePoint.trim().length > 0;
  const savedLabel = remarkSavedAt
    ? `Remark saved ${new Date(remarkSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "No remark saved";

  function appendRemark(remark: string) {
    onOverridePointChange(overridePoint.trim() ? `${overridePoint.trim()}\n${remark}` : remark);
  }

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
          <p className="mt-2 text-xs font-semibold">Expires at {cooldownExpiresAt ?? result.provisionalDecision?.expiresAt}</p>
          <p className="mt-1 text-xs font-semibold">{savedLabel}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <button
              type="button"
              onClick={onAddRemark}
              disabled={!overrideCaptured}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-amber/40 bg-white px-3 text-sm font-semibold text-[#7a4d00] transition hover:bg-[#fff8e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              Add remark
            </button>
            <button
              type="button"
              onClick={onExtendCooldown}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-amber/40 bg-white px-3 text-sm font-semibold text-[#7a4d00] transition hover:bg-[#fff8e6]"
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Extend 10m
            </button>
            <button
              type="button"
              onClick={onOverrule}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-semibold text-white transition hover:bg-[#a62f08]"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Overrule
            </button>
          </div>
        </div>
        <div className="grid gap-2">
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
          <div className="flex flex-wrap gap-2">
            {remarkBank.map((remark) => (
              <button
                key={remark}
                type="button"
                onClick={() => appendRemark(remark)}
                className="min-h-9 rounded-md border border-amber/30 bg-white px-2.5 text-left text-xs font-semibold text-[#7a4d00] transition hover:bg-[#fff8e6]"
              >
                {remark}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
