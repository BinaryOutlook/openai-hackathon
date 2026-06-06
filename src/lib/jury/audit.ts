import type {
  AuditRecord,
  HumanOverride,
  JuryCaseInput,
  JuryRunResult,
  RoutingDecision
} from "@/types/jury";
import { getStandardAutomationClause } from "@/lib/jury/routing";

export type BuildAuditRecordInput = {
  caseInput: JuryCaseInput;
  route: RoutingDecision;
  jury: JuryRunResult | null;
  humanOverride?: HumanOverride | null;
  createdAt?: string;
};

export function buildAuditRecord({
  caseInput,
  route,
  jury,
  humanOverride = null,
  createdAt = new Date().toISOString()
}: BuildAuditRecordInput): AuditRecord {
  return {
    id: `${caseInput.id}-${route.routeKind}-${createdAt}`,
    caseId: caseInput.id,
    createdAt,
    routeKind: route.routeKind,
    routingReason: route.routingReason,
    warnings: route.warnings,
    indicators: route.indicators,
    evidenceIds: caseInput.evidence.map((evidence) => evidence.id),
    evidenceSources: Object.fromEntries(
      caseInput.evidence.map((evidence) => [evidence.id, evidence.source])
    ),
    requestReason: caseInput.requestReason,
    juryMode: jury?.mode ?? "not_run",
    verdict: jury?.verdict ?? null,
    humanOverride,
    finalDecision: getFinalDecision(caseInput, route, jury, humanOverride)
  };
}

function getFinalDecision(
  caseInput: JuryCaseInput,
  route: RoutingDecision,
  jury: JuryRunResult | null,
  humanOverride: HumanOverride | null
) {
  if (humanOverride?.status === "submitted") {
    return `Human override submitted: ${humanOverride.overrulingPoint ?? "No overruling point provided."}`;
  }

  if (route.routeKind === "standard_automation") {
    return getStandardAutomationClause(caseInput)?.finalDecision
      ?? "Standard platform automation selected without AI jury review.";
  }

  if (route.routeKind === "human_review") {
    return "Human reviewer owns the final decision.";
  }

  return jury?.verdict.decision ?? "Provisional AI decision pending cooldown.";
}
