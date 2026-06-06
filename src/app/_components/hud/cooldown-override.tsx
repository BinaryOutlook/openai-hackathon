import type { WorkflowResult } from "@/types/jury";

export function CooldownOverridePanel({
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
