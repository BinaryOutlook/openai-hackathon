import type {
  EscalationSignal,
  JuryCaseInput,
  JuryRunResult,
  RoutingDecision
} from "@/types/jury";

export const AUTO_DECISION_CONFIDENCE_THRESHOLD = 0.75;
export const PROVISIONAL_DECISION_COOLDOWN_SECONDS = 60;

export type RoutingInput = {
  caseInput: JuryCaseInput;
  juryResult?: JuryRunResult | null;
  confidence?: number | null;
  decidedAt?: string;
};

export function isUncontestedCase(caseInput: JuryCaseInput): boolean {
  return getStandardAutomationClause(caseInput) !== null;
}

export function getStandardAutomationClause(caseInput: JuryCaseInput) {
  if (detectHardEscalation(caseInput).length > 0 || caseInput.evidence.length === 0) {
    return null;
  }

  if (caseInput.sellerAgreesToReturn) {
    return {
      id: "seller_consent",
      title: "Return/refund eligible by seller consent",
      routingReason: "Seller consent supports standard platform return/refund automation without AI jury review.",
      finalDecision: "Return/refund eligible by seller consent. Standard platform automation selected without AI jury review."
    };
  }

  if (isValidSevenDayNoReasonReturn(caseInput) && !hasSellerDispute(caseInput)) {
    return {
      id: "seven_day_policy",
      title: "Return/refund eligible under seven-day policy",
      routingReason: "The request is an in-scope seven-day no-reason return, so standard policy automation applies without AI jury review.",
      finalDecision: "Return/refund eligible under the seven-day policy. Standard platform automation selected without AI jury review."
    };
  }

  return null;
}

export function detectHardEscalation(caseInput: JuryCaseInput): EscalationSignal[] {
  const signals: EscalationSignal[] = [];

  if (containsPromptInjectionLikeText(caseInput)) {
    signals.push(signal(
      "prompt_injection",
      "Prompt injection attempt",
      "Submitted buyer or seller text contains instruction-like language and must be reviewed as evidence only.",
      "blocker",
      citedEvidenceIds(caseInput, ["text"])
    ));
  }

  if (hasReturnExclusion(caseInput)) {
    signals.push(signal(
      "return_exclusion",
      "Return exclusion",
      "The request appears to involve a restricted, opened, used, or otherwise excluded return category.",
      "blocker",
      citedEvidenceIds(caseInput, ["policy", "text", "image"])
    ));
  }

  if (hasFraudOrManipulationRisk(caseInput)) {
    signals.push(signal(
      "fraud_risk",
      "Potential fraud indicator",
      "The case includes repeated-return, abuse, empty-parcel, manipulation, or contradictory-history indicators.",
      "blocker",
      citedEvidenceIds(caseInput, ["history", "text"])
    ));
  }

  if (hasMandatorySopTrigger(caseInput)) {
    signals.push(signal(
      "sop_trigger",
      "Mandatory SOP trigger",
      "The policy or case text indicates that manual operations review is required before final action.",
      "blocker",
      citedEvidenceIds(caseInput, ["policy"])
    ));
  }

  if (caseInput.orderValue > 500) {
    signals.push(signal(
      "high_value",
      "High-value item",
      "The order value exceeds the manual approval threshold for the MVP workflow.",
      "blocker"
    ));
  }

  return signals;
}

export function selectRoute(input: RoutingInput): RoutingDecision {
  const decidedAt = input.decidedAt ?? new Date().toISOString();
  const confidence = input.confidence ?? input.juryResult?.verdict.overallConfidence ?? null;
  const hardSignals = detectHardEscalation(input.caseInput);
  const standardAutomationClause = getStandardAutomationClause(input.caseInput);

  // Uncontested cases bypass the AI jury by product decision.
  if (standardAutomationClause) {
    return {
      routeKind: "standard_automation",
      routingReason: standardAutomationClause.routingReason,
      warnings: [],
      indicators: [standardAutomationClause.title],
      requiresJury: false,
      confidence: null,
      cooldownSeconds: null,
      auditTrail: [
        auditEntry(decidedAt, "route_selected", `${standardAutomationClause.title} before jury execution.`)
      ]
    };
  }

  if (hardSignals.length > 0) {
    return {
      routeKind: "human_review",
      routingReason: "Hard escalation signals require a human final decision with AI context only.",
      warnings: hardSignals.map((hardSignal) => hardSignal.label),
      indicators: hardSignals.map((hardSignal) => hardSignal.description),
      requiresJury: true,
      confidence,
      cooldownSeconds: null,
      auditTrail: [
        auditEntry(
          decidedAt,
          "route_selected",
          `Human review selected for hard signals: ${hardSignals.map((hardSignal) => hardSignal.id).join(", ")}.`
        )
      ]
    };
  }

  if (input.juryResult?.verdict.escalate) {
    return {
      routeKind: "human_review",
      routingReason: "The AI jury found escalation reasons, so a human reviewer owns the final call.",
      warnings: input.juryResult.verdict.escalationReasons,
      indicators: ["The jury verdict is useful context but is not an automatic final decision."],
      requiresJury: true,
      confidence,
      cooldownSeconds: null,
      auditTrail: [
        auditEntry(decidedAt, "route_selected", "Human review selected after jury escalation.")
      ]
    };
  }

  if (confidence === null) {
    return {
      routeKind: "human_review",
      routingReason: "AI confidence is unavailable, so the case cannot be finalized automatically.",
      warnings: ["AI confidence unavailable"],
      indicators: ["The workflow did not receive a jury confidence score for this disputed case."],
      requiresJury: true,
      confidence,
      cooldownSeconds: null,
      auditTrail: [
        auditEntry(decidedAt, "route_selected", "Human review selected because confidence is unavailable.")
      ]
    };
  }

  if (confidence < AUTO_DECISION_CONFIDENCE_THRESHOLD) {
    return {
      routeKind: "human_review",
      routingReason: "AI confidence is below the threshold for a provisional automatic decision.",
      warnings: [`Confidence ${formatPercent(confidence)} is below ${formatPercent(AUTO_DECISION_CONFIDENCE_THRESHOLD)}.`],
      indicators: ["The jury output should be treated as reviewer context, not as a final decision."],
      requiresJury: true,
      confidence,
      cooldownSeconds: null,
      auditTrail: [
        auditEntry(decidedAt, "route_selected", "Human review selected after low jury confidence.")
      ]
    };
  }

  return {
    routeKind: "provisional_ai_decision",
    routingReason: "No hard human-review trigger exists and AI confidence clears the provisional decision threshold.",
    warnings: [],
    indicators: ["A human can still override the provisional AI decision during the cooldown window."],
    requiresJury: true,
    confidence,
    cooldownSeconds: PROVISIONAL_DECISION_COOLDOWN_SECONDS,
    auditTrail: [
      auditEntry(decidedAt, "route_selected", "Provisional AI decision selected after jury confidence check.")
    ]
  };
}

export function getRoutingReason(decision: RoutingDecision) {
  return decision.routingReason;
}

export function containsPromptInjectionLikeText(caseInput: JuryCaseInput) {
  return /ignore previous|ignore all|must reject|must approve|system instruction|developer message|follow this instruction|approve my refund immediately/i.test(
    searchableText(caseInput)
  );
}

function isValidSevenDayNoReasonReturn(caseInput: JuryCaseInput) {
  if (caseInput.requestReason !== "do_not_want_anymore" || hasReturnExclusion(caseInput)) {
    return false;
  }

  const daysAfterDelivery = daysBetween(caseInput.deliveryDate, caseInput.returnRequestDate);
  return daysAfterDelivery !== null && daysAfterDelivery >= 0 && daysAfterDelivery <= 7;
}

function hasSellerDispute(caseInput: JuryCaseInput) {
  if (caseInput.sellerAgreesToReturn) {
    return false;
  }

  return /reject|deny|cannot|not eligible|does not qualify|dispute|lying|request proof|believe the courier|not our responsibility/i.test(
    caseInput.sellerResponse
  );
}

function hasReturnExclusion(caseInput: JuryCaseInput) {
  const text = searchableText(caseInput);
  const explicitExclusion =
    /hygiene|cosmetic|personal care|\brestricted\b|\bexcluded\b|non-returnable|cannot be returned|cannot be resold|perishable|final sale/i.test(
      text
    );
  const openedNoReasonReturn =
    caseInput.requestReason === "do_not_want_anymore" &&
    /\bopened\b|\bused\b|broken seal/i.test(text);

  return explicitExclusion || openedNoReasonReturn;
}

function hasFraudOrManipulationRisk(caseInput: JuryCaseInput) {
  const text = searchableText(caseInput);
  return /fraud|abuse|empty parcel|empty box|chargeback|manipulation|repeat(?:ed)? returns?|returns after opening|returns after use|high risk|suspicious|contradictory/i.test(
    text
  );
}

function hasMandatorySopTrigger(caseInput: JuryCaseInput) {
  const text = searchableText(caseInput);
  return /manual review required|manual approval|required human review|risk-team review|sop trigger|operations review required/i.test(
    text
  );
}

function citedEvidenceIds(caseInput: JuryCaseInput, kinds: JuryCaseInput["evidence"][number]["kind"][]) {
  return caseInput.evidence
    .filter((evidence) => kinds.includes(evidence.kind))
    .map((evidence) => evidence.id);
}

function signal(
  id: EscalationSignal["id"],
  label: string,
  description: string,
  severity: EscalationSignal["severity"],
  evidenceIds: string[] = []
): EscalationSignal {
  return { id, label, description, severity, evidenceIds };
}

function auditEntry(at: string, action: string, detail: string) {
  return { at, action, detail };
}

function searchableText(caseInput: JuryCaseInput) {
  return [
    caseInput.title,
    caseInput.returnType,
    caseInput.productTitle,
    caseInput.category,
    caseInput.policyText,
    caseInput.buyerClaim,
    caseInput.sellerResponse,
    caseInput.buyerHistory,
    caseInput.sellerHistory,
    ...caseInput.chatHistory,
    ...caseInput.logisticsEvents,
    ...caseInput.evidence.map((evidence) => `${evidence.label} ${evidence.summary}`)
  ].join(" ");
}

function daysBetween(startDate: string, endDate: string) {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return Math.floor((end - start) / 86_400_000);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
