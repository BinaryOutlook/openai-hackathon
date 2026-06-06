import { Edit3, ImagePlus } from "lucide-react";
import type { EvidenceSource, JuryCaseInput, RequestReason } from "@/types/jury";
import { ReadOnlyMetric } from "../ui";
import { requestReasonLabels, sourceLabels } from "../../_lib/workspace";

export function CaseIntake({
  caseInput,
  uploadSource,
  isEditable,
  isRunning,
  hasUnrunChanges,
  onToggleEditable,
  onUpdateCase,
  onUpdateUploadSource,
  onAddEvidence
}: {
  caseInput: JuryCaseInput;
  uploadSource: EvidenceSource;
  isEditable: boolean;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  onToggleEditable: () => void;
  onUpdateCase: <K extends keyof JuryCaseInput>(key: K, value: JuryCaseInput[K]) => void;
  onUpdateUploadSource: (source: EvidenceSource) => void;
  onAddEvidence: (files: FileList | null, source: EvidenceSource) => void;
}) {
  const controlsDisabled = !isEditable || isRunning;
  const inputClass =
    "min-h-11 rounded-md border border-line bg-white px-3 text-sm disabled:bg-[#f5f5f5] disabled:text-graphite";
  const textAreaClass =
    "min-h-[6.5rem] max-h-44 resize-y rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 disabled:bg-[#f5f5f5] disabled:text-graphite";

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Case Intake</h2>
          <p className="mt-1 text-xs text-graphite">
            {isEditable ? "Editing reviewer copy" : "Buyer and seller submissions locked"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleEditable}
          disabled={isRunning}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-teal bg-white px-3 text-sm font-semibold text-teal transition hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          {isEditable ? "Lock" : "Edit"}
        </button>
      </div>

      {hasUnrunChanges ? (
        <div className="mt-3 rounded-md border border-amber/30 bg-[#fff3d6] px-3 py-2 text-sm font-medium text-[#7a4d00]">
          Changes made. Run workflow to refresh computed sections.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyMetric label="Value" value={`$${caseInput.orderValue}`} />
          <ReadOnlyMetric label="Category" value={caseInput.category} />
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Request reason
          <select
            value={caseInput.requestReason}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("requestReason", event.target.value as RequestReason)}
            className={inputClass}
          >
            {Object.entries(requestReasonLabels).map(([reason, label]) => (
              <option key={reason} value={reason}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm font-medium has-[:disabled]:bg-[#f5f5f5]">
          <input
            type="checkbox"
            checked={caseInput.sellerAgreesToReturn}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("sellerAgreesToReturn", event.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Seller agrees to standard return
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Buyer claim
          <textarea
            value={caseInput.buyerClaim}
            rows={4}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("buyerClaim", event.target.value)}
            className={textAreaClass}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Seller response
          <textarea
            value={caseInput.sellerResponse}
            rows={4}
            disabled={controlsDisabled}
            onChange={(event) => onUpdateCase("sellerResponse", event.target.value)}
            className={textAreaClass}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Upload source
          <select
            value={uploadSource}
            onChange={(event) => onUpdateUploadSource(event.target.value as EvidenceSource)}
            className={inputClass}
          >
            {(["buyer", "seller", "reviewer", "logistics"] satisfies EvidenceSource[]).map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-teal bg-[#ffebe6] px-3 text-sm font-semibold text-teal transition hover:bg-[#fff7f4]">
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
