import { DEMO_CASES } from "@/lib/jury/demo-cases";
import type {
  AgentOpinion,
  AgentVote,
  EvidenceItem,
  EvidenceSource,
  HumanOverride,
  JuryCaseInput,
  RequestReason,
  RouteKind,
  WorkflowResult
} from "@/types/jury";

export const voteLabels: Record<AgentVote, string> = {
  support_buyer: "Buyer",
  support_seller: "Seller",
  need_more_evidence: "More evidence",
  escalate: "Escalate"
};

export const voteStyles: Record<AgentVote, string> = {
  support_buyer: "border-teal/30 bg-mint text-teal",
  support_seller: "border-line bg-gray-100 text-ink",
  need_more_evidence: "border-amber/30 bg-[#fff3d6] text-[#7a4d00]",
  escalate: "border-coral/30 bg-[#fce8e6] text-coral"
};

export const requestReasonLabels: Record<RequestReason, string> = {
  do_not_want_anymore: "Do not want anymore",
  description_mismatch: "Description mismatch",
  material_mismatch: "Material mismatch",
  size_mismatch: "Size mismatch",
  production_or_warranty_mismatch: "Production or warranty",
  color_style_model_mismatch: "Color, style, or model",
  quality_issue: "Quality issue",
  missing_item_or_accessory: "Missing item or accessory",
  damaged_or_dirty_item: "Damaged or dirty item"
};

export const sourceLabels: Record<EvidenceSource, string> = {
  buyer: "Buyer",
  seller: "Seller",
  platform_policy: "Policy",
  logistics: "Logistics",
  history: "History",
  reviewer: "Reviewer"
};

export const evidenceSourcePrefixes: Record<EvidenceSource, string> = {
  buyer: "B",
  seller: "S",
  reviewer: "R",
  logistics: "L",
  platform_policy: "P",
  history: "H"
};

export const routeLabels: Record<RouteKind, string> = {
  standard_automation: "Standard automation",
  human_review: "Human review",
  provisional_ai_decision: "Provisional decision"
};

export const routeStyles: Record<RouteKind, string> = {
  standard_automation: "border-teal/30 bg-mint text-teal",
  human_review: "border-coral/30 bg-[#fce8e6] text-coral",
  provisional_ai_decision: "border-amber/30 bg-[#fff3d6] text-[#7a4d00]"
};

export type EvidenceAliases = Record<string, string>;
export type WorkspaceView = "hud" | "human-review" | "ai-jury";
export type QueueCaseStatus = "pending" | "done" | "archived";

export const queueStatusLabels: Record<QueueCaseStatus, string> = {
  pending: "Pending",
  done: "Done",
  archived: "Archived"
};

export const queueStatusStyles: Record<QueueCaseStatus, string> = {
  pending: "border-amber/30 bg-[#fff3d6] text-[#7a4d00]",
  done: "border-teal/30 bg-mint text-teal",
  archived: "border-line bg-[#f5f5f5] text-graphite"
};

export const MAX_EVIDENCE_IMAGE_BYTES = 4 * 1024 * 1024;

export type ReviewerDecision = {
  finalVerdict: string;
  reason: string;
  evidenceReliedOn: string[];
  overrideReason: string;
  escalationTarget: string;
  notes: string;
  updatedAt: string;
};

export function cloneCase(caseInput: JuryCaseInput): JuryCaseInput {
  return JSON.parse(JSON.stringify(caseInput)) as JuryCaseInput;
}

export function buildDefaultReviewerDecision(caseInput?: JuryCaseInput): ReviewerDecision {
  return {
    finalVerdict: "",
    reason: "",
    evidenceReliedOn: caseInput?.evidence.slice(0, 2).map((evidence) => evidence.id) ?? [],
    overrideReason: "",
    escalationTarget: "marketplace-ops",
    notes: "",
    updatedAt: ""
  };
}

export function buildHumanOverride(overridePoint: string): HumanOverride | null {
  const trimmedPoint = overridePoint.trim();

  if (!trimmedPoint) {
    return null;
  }

  return {
    status: "submitted",
    overrulingPoint: trimmedPoint,
    reviewerId: "demo-reviewer",
    submittedAt: new Date().toISOString()
  };
}

export function getClientFinalDecision(
  result: WorkflowResult,
  humanOverride: HumanOverride | null,
  cooldownRemaining: number
) {
  if (humanOverride?.status === "submitted") {
    return `Human override submitted: ${humanOverride.overrulingPoint}`;
  }

  if (result.route.routeKind === "provisional_ai_decision" && cooldownRemaining === 0) {
    return `AI decision finalized after cooldown: ${result.provisionalDecision?.verdict.decision}`;
  }

  return result.audit.finalDecision;
}

export function fileToDataUrl(file: File) {
  if (file.size > MAX_EVIDENCE_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than the 4 MB evidence image limit.`);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function buildEvidenceAliases(evidenceItems: EvidenceItem[]): EvidenceAliases {
  const counts: Partial<Record<EvidenceSource, number>> = {};

  return Object.fromEntries(
    evidenceItems.map((evidence) => {
      const nextCount = (counts[evidence.source] ?? 0) + 1;
      counts[evidence.source] = nextCount;
      return [evidence.id, `${evidenceSourcePrefixes[evidence.source]}${nextCount}`];
    })
  );
}

export function aliasEvidenceReferences(items: string[], evidenceAliases: EvidenceAliases) {
  return items.map((item) =>
    Object.entries(evidenceAliases).reduce((current, [canonicalId, displayId]) => {
      return current.replace(new RegExp(`\\b${escapeRegExp(canonicalId)}\\b`, "g"), displayId);
    }, item)
  );
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function uniqueText(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function formatEvidenceList(ids: string[], evidenceAliases: EvidenceAliases) {
  if (!ids.length) {
    return "No cited evidence";
  }

  return ids.map((id) => evidenceAliases[id] ?? id).join(", ");
}

export function getWorkflowStage(elapsedSeconds: number) {
  if (elapsedSeconds <= 1) {
    return {
      label: "Validating intake",
      detail: "Checking buyer, seller, policy, and evidence fields before routing."
    };
  }

  if (elapsedSeconds <= 3) {
    return {
      label: "Routing case",
      detail: "Selecting standard automation, human review, or provisional decision path."
    };
  }

  if (elapsedSeconds <= 7) {
    return {
      label: "Running jury",
      detail: "Collecting juror opinions, confidence, cited evidence, and disagreement notes."
    };
  }

  return {
    label: "Building audit",
    detail: "Preparing verdict, reviewer context, route trace, and exportable audit record."
  };
}

export function getQueueMeta(caseInput: JuryCaseInput) {
  if (caseInput.sellerAgreesToReturn) {
    return {
      priority: "Routine",
      risk: "Low",
      sla: "24h",
      waiting: "12m",
      owner: "Auto",
      tone: "bg-mint text-teal",
      filters: ["New evidence"]
    };
  }

  if (caseInput.id.includes("opened")) {
    return {
      priority: "High",
      risk: "Policy",
      sla: "2h",
      waiting: "48m",
      owner: "Risk",
      tone: "bg-[#fce8e6] text-coral",
      filters: ["Needs escalation", "Policy risk"]
    };
  }

  if (caseInput.id.includes("ambiguous")) {
    return {
      priority: "Medium",
      risk: "Low conf.",
      sla: "8h",
      waiting: "31m",
      owner: "Ops",
      tone: "bg-[#fff3d6] text-[#7a4d00]",
      filters: ["Low confidence"]
    };
  }

  return {
    priority: "Medium",
    risk: "Dispute",
    sla: "4h",
    waiting: "22m",
    owner: "Ops",
    tone: "bg-[#ffebe6] text-teal",
    filters: caseInput.id.includes("damaged") ? ["Needs escalation", "High disagreement"] : ["High disagreement", "New evidence"]
  };
}

export function summarizeHistory(history: string) {
  const returnMatch = history.match(/(\d+)\s+returns?\s+across\s+(\d+)\s+orders/i);
  if (returnMatch) {
    const returns = Number(returnMatch[1]);
    const orders = Number(returnMatch[2]);
    const percentage = orders ? Math.round((returns / orders) * 100) : 0;
    return `${returns}/${orders} returns (${percentage}%)`;
  }

  const complaintMatch = history.match(/(\d+)\s+([^,.]+complaints?[^,.]*)/i);
  if (complaintMatch) {
    return `${complaintMatch[1]} ${complaintMatch[2]}`;
  }

  return "Normal recent history";
}

export function getStandardAutomationDecision(caseInput: JuryCaseInput) {
  if (caseInput.sellerAgreesToReturn) {
    return {
      title: "Return/refund eligible by seller consent",
      clause: "Seller accepted the return under the platform flow.",
      reason: "Seller consent supports standard automation without jury review."
    };
  }

  return {
    title: "Return/refund eligible under 7-day policy",
    clause: "In-scope no-reason return within the return window.",
    reason: "Policy eligibility supports standard automation without jury review."
  };
}

export function getSimilarPastCases(caseInput: JuryCaseInput) {
  return DEMO_CASES.filter(
    (demoCase) =>
      demoCase.id !== caseInput.id &&
      (demoCase.requestReason === caseInput.requestReason || demoCase.category === caseInput.category)
  ).slice(0, 2);
}

export function getSystemRecommendation(result: WorkflowResult, caseInput: JuryCaseInput) {
  if (result.route.routeKind === "standard_automation") {
    return getStandardAutomationDecision(caseInput).title;
  }

  return result.provisionalDecision?.verdict.decision ?? result.jury?.verdict.decision ?? result.route.routingReason;
}

export function formatReviewerVerdict(value: string) {
  switch (value) {
    case "approve_return":
      return "Approve return/refund";
    case "approve_with_note":
      return "Approve with note";
    case "reject_return":
      return "Reject with reason";
    case "request_more_evidence":
      return "Request more evidence";
    case "escalate":
      return "Escalate supervisor";
    default:
      return "Not selected";
  }
}

export function buildReviewerDecisionRecord({
  caseInput,
  reviewerDecision,
  result,
  evidenceAliases,
  similarCases,
  timestamp
}: {
  caseInput: JuryCaseInput;
  reviewerDecision: ReviewerDecision;
  result: WorkflowResult;
  evidenceAliases: EvidenceAliases;
  similarCases: JuryCaseInput[];
  timestamp: string;
}) {
  const warnings = uniqueText([
    ...result.route.warnings,
    ...(result.jury?.verdict.escalationReasons ?? [])
  ]);

  return {
    caseId: caseInput.id,
    decision: reviewerDecision.finalVerdict || "not_selected",
    decisionLabel: formatReviewerVerdict(reviewerDecision.finalVerdict),
    reason: reviewerDecision.reason.trim(),
    notes: reviewerDecision.notes.trim(),
    overrideReason: reviewerDecision.overrideReason.trim(),
    evidenceReliedOn: reviewerDecision.evidenceReliedOn.map((id) => ({
      id,
      alias: evidenceAliases[id] ?? id,
      label: caseInput.evidence.find((evidence) => evidence.id === id)?.label ?? id
    })),
    systemRecommendation: getSystemRecommendation(result, caseInput),
    routeKind: result.route.routeKind,
    routeLabel: routeLabels[result.route.routeKind],
    riskWarnings: warnings,
    escalationSignals: result.route.indicators,
    similarPastCases: similarCases.map((demoCase) => ({
      id: demoCase.id,
      title: demoCase.title,
      requestReason: requestReasonLabels[demoCase.requestReason],
      category: demoCase.category,
      orderValue: demoCase.orderValue
    })),
    timestamp,
    persistenceStatus: "exported_audit_json"
  };
}

export function getExportValidation(
  result: WorkflowResult | null,
  caseInput: JuryCaseInput,
  reviewerDecision: ReviewerDecision,
  requiresHumanClosure = false
) {
  if (!result) {
    return {
      canExport: false,
      reason: "Run workflow before exporting."
    };
  }

  if (!requiresHumanClosure && result.route.routeKind !== "human_review") {
    return {
      canExport: true,
      reason: "Ready to export."
    };
  }

  if (!reviewerDecision.finalVerdict) {
    return {
      canExport: false,
      reason: "Select a final verdict before export."
    };
  }

  if (!reviewerDecision.reason.trim()) {
    return {
      canExport: false,
      reason: "Add the reviewer rationale before export."
    };
  }

  if (!reviewerDecision.evidenceReliedOn.length) {
    return {
      canExport: false,
      reason: "Select at least one evidence item before export."
    };
  }

  if (
    !isReviewerAligned(getSystemRecommendation(result, caseInput), reviewerDecision.finalVerdict) &&
    !reviewerDecision.overrideReason.trim()
  ) {
    return {
      canExport: false,
      reason: "Add an override reason for a decision that differs from the system."
    };
  }

  return {
    canExport: true,
    reason: "Ready to export."
  };
}

export function getRequiredHumanAction(
  result: WorkflowResult | null,
  caseInput: JuryCaseInput,
  hasUnrunChanges: boolean,
  isRunning: boolean
) {
  if (isRunning) {
    return "Wait for current workflow";
  }

  if (hasUnrunChanges) {
    return "Run workflow";
  }

  if (!result) {
    return "Run workflow";
  }

  if (result.route.routeKind === "standard_automation") {
    return getStandardAutomationDecision(caseInput).title;
  }

  if (result.route.routeKind === "human_review") {
    return "Complete final verdict and rationale";
  }

  return "Approve cooldown result or submit override";
}

export function formatVoteSplit(voteSummary: Record<AgentVote, number>) {
  return [
    `${voteSummary.support_buyer ?? 0} buyer`,
    `${voteSummary.support_seller ?? 0} seller`,
    `${voteSummary.need_more_evidence ?? 0} more evidence`,
    `${voteSummary.escalate ?? 0} escalate`
  ].join(" / ");
}

export function summarizeOpinion(reasoning: string) {
  const firstSentence = reasoning.split(/(?<=[.!?])\s+/)[0]?.trim();
  return firstSentence || reasoning;
}

export function buildDisagreementGroups(opinions: AgentOpinion[], evidenceAliases: EvidenceAliases) {
  const factual = opinions.filter((opinion) => /missing|does not rebut|not provided|unclear/i.test(opinion.reasoning));
  const policy = opinions.filter((opinion) => /policy|eligible|restricted|SOP|manual/i.test(opinion.reasoning));
  const evidenceQuality = opinions.filter((opinion) => opinion.evidenceStrength < 0.65);
  const confidenceRisk = opinions.filter((opinion) => opinion.confidence < 0.65 || opinion.riskScore >= 0.7);
  const missingInfo = opinions.filter((opinion) => /ask|request|provide|additional/i.test(opinion.recommendation));
  const cited = Array.from(new Set(opinions.flatMap((opinion) => opinion.citedEvidenceIds))).map(
    (id) => evidenceAliases[id] ?? id
  );

  return [
    {
      title: "Factual disagreement",
      count: factual.length,
      detail: factual.length
        ? "Jurors disagree about whether the submitted facts fully prove the claim."
        : "No major factual split detected.",
      tone: factual.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    },
    {
      title: "Policy interpretation",
      count: policy.length,
      detail: policy.length
        ? "Policy fit or exclusion rules appear in juror reasoning."
        : "No policy-specific conflict detected.",
      tone: policy.length ? "bg-[#ffebe6] text-teal" : "bg-mint text-teal"
    },
    {
      title: "Evidence quality",
      count: evidenceQuality.length,
      detail: evidenceQuality.length
        ? `Evidence strength is weak or uneven. Cited IDs: ${cited.join(", ") || "none"}.`
        : "Evidence quality is sufficient for the current route.",
      tone: evidenceQuality.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    },
    {
      title: "Confidence and risk",
      count: confidenceRisk.length,
      detail: confidenceRisk.length
        ? "One or more jurors flagged low confidence or high risk."
        : "Confidence and risk are not materially split.",
      tone: confidenceRisk.length ? "bg-[#fce8e6] text-coral" : "bg-mint text-teal"
    },
    {
      title: "Missing information",
      count: missingInfo.length,
      detail: missingInfo.length
        ? "At least one juror recommends requesting more evidence before final action."
        : "No missing-information request dominates the panel.",
      tone: missingInfo.length ? "bg-[#fff3d6] text-[#7a4d00]" : "bg-mint text-teal"
    }
  ];
}

export function formatEscalationTarget(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isReviewerAligned(systemDecision: string, reviewerVerdict: string) {
  const normalizedSystem = systemDecision.toLowerCase();

  if (reviewerVerdict === "approve_return" || reviewerVerdict === "approve_with_note") {
    return normalizedSystem.includes("approve") || normalizedSystem.includes("buyer");
  }

  if (reviewerVerdict === "reject_return") {
    return normalizedSystem.includes("reject") || normalizedSystem.includes("seller");
  }

  if (reviewerVerdict === "request_more_evidence") {
    return normalizedSystem.includes("evidence");
  }

  return normalizedSystem.includes("human") || normalizedSystem.includes("escalate");
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
