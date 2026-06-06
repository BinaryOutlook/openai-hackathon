import type { AgentOpinion, AgentVote, FinalVerdict, JuryCaseInput } from "@/types/jury";

export const HIGH_VALUE_THRESHOLD = 500;
const SCORE_THRESHOLD = 0.65;
const FRAUD_THRESHOLD = 0.7;
const MIN_VOTE_MARGIN = 2;

const VOTE_ORDER: AgentVote[] = [
  "support_buyer",
  "support_seller",
  "need_more_evidence",
  "escalate"
];

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function summarizeVotes(opinions: AgentOpinion[]): Record<AgentVote, number> {
  return VOTE_ORDER.reduce<Record<AgentVote, number>>((summary, vote) => {
    summary[vote] = opinions.filter((opinion) => opinion.vote === vote).length;
    return summary;
  }, {
    support_buyer: 0,
    support_seller: 0,
    need_more_evidence: 0,
    escalate: 0
  });
}

export function getVoteMargin(opinions: AgentOpinion[]) {
  const counts = Object.values(summarizeVotes(opinions)).sort((a, b) => b - a);
  return (counts[0] ?? 0) - (counts[1] ?? 0);
}

// REVIEWER_NOTE: Confidence blends juror confidence, vote margin, evidence strength, and risk so the score is legible rather than magical.
export function calculateOverallConfidence(opinions: AgentOpinion[]) {
  if (opinions.length === 0) {
    return 0;
  }

  const averageConfidence = average(opinions.map((opinion) => opinion.confidence));
  const normalizedVoteMargin = getVoteMargin(opinions) / opinions.length;
  const evidenceStrength = average(opinions.map((opinion) => opinion.evidenceStrength));
  const riskScore = Math.max(...opinions.map((opinion) => opinion.riskScore));

  return clamp(
    0.45 * averageConfidence +
      0.35 * normalizedVoteMargin +
      0.2 * evidenceStrength -
      0.25 * riskScore
  );
}

// SAFETY_NOTE: Escalation rules privilege caution for low confidence, narrow votes, fraud risk, prompt injection, and high-value orders.
export function shouldEscalate(caseInput: JuryCaseInput, opinions: AgentOpinion[], confidence: number) {
  const voteMargin = getVoteMargin(opinions);
  const riskScore = Math.max(0, ...opinions.map((opinion) => opinion.riskScore));
  const promptInjectionDetected = opinions.some((opinion) => opinion.promptInjectionDetected);
  const reasons: string[] = [];

  if (confidence < SCORE_THRESHOLD) {
    reasons.push("Overall confidence is below the auto-resolution threshold.");
  }

  if (voteMargin < MIN_VOTE_MARGIN) {
    reasons.push("The jury vote margin is narrow.");
  }

  if (riskScore >= FRAUD_THRESHOLD) {
    reasons.push("Fraud or abuse risk is high enough for risk-team review.");
  }

  if (promptInjectionDetected) {
    reasons.push("Submitted buyer or seller text contains an instruction-like manipulation attempt.");
  }

  if (caseInput.orderValue > HIGH_VALUE_THRESHOLD) {
    reasons.push("The order value exceeds the high-value manual approval threshold.");
  }

  return {
    escalate: reasons.length > 0,
    reasons
  };
}

export function buildVerdict(caseInput: JuryCaseInput, opinions: AgentOpinion[]): FinalVerdict {
  const voteSummary = summarizeVotes(opinions);
  const voteMargin = getVoteMargin(opinions);
  const overallConfidence = calculateOverallConfidence(opinions);
  const riskScore = Math.max(0, ...opinions.map((opinion) => opinion.riskScore));
  const escalation = shouldEscalate(caseInput, opinions, overallConfidence);
  const dominantVote = getDominantVote(voteSummary);
  const decision = getDecision(dominantVote, escalation.escalate);
  const refundType = getRefundType(dominantVote, escalation.escalate);

  return {
    decision,
    refundType,
    responsibility: getResponsibility(dominantVote, caseInput.returnType),
    overallConfidence,
    voteSummary,
    voteMargin,
    riskScore,
    escalate: escalation.escalate,
    escalationReasons: escalation.reasons,
    rationale: getRationale(caseInput, dominantVote, escalation.escalate, overallConfidence),
    recommendedActions: getRecommendedActions(dominantVote, escalation.escalate, caseInput)
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getDominantVote(voteSummary: Record<AgentVote, number>): AgentVote {
  return VOTE_ORDER.reduce<AgentVote>((winner, vote) => {
    return voteSummary[vote] > voteSummary[winner] ? vote : winner;
  }, "support_buyer");
}

function getDecision(vote: AgentVote, escalate: boolean) {
  if (escalate) {
    return "Escalate to human review";
  }

  if (vote === "support_buyer") {
    return "Approve buyer return";
  }

  if (vote === "support_seller") {
    return "Reject return request";
  }

  return "Request more evidence";
}

function getRefundType(vote: AgentVote, escalate: boolean) {
  if (escalate) {
    return "Manual reviewer to confirm refund path";
  }

  if (vote === "support_buyer") {
    return "Full refund after return received";
  }

  if (vote === "support_seller") {
    return "No refund recommended";
  }

  return "Pending additional evidence";
}

function getResponsibility(vote: AgentVote, returnType: string) {
  if (vote === "support_buyer" && returnType.toLowerCase().includes("damage")) {
    return { buyer: 10, seller: 35, logistics: 55 };
  }

  if (vote === "support_buyer") {
    return { buyer: 10, seller: 75, logistics: 15 };
  }

  if (vote === "support_seller") {
    return { buyer: 70, seller: 20, logistics: 10 };
  }

  return { buyer: 33, seller: 34, logistics: 33 };
}

function getRationale(
  caseInput: JuryCaseInput,
  vote: AgentVote,
  escalate: boolean,
  confidence: number
) {
  const confidenceText = `${Math.round(confidence * 100)}%`;

  if (escalate) {
    return `${caseInput.title} needs human review because the jury found material risk or uncertainty despite a ${confidenceText} calculated confidence score.`;
  }

  if (vote === "support_buyer") {
    return `The jury found the buyer-side evidence stronger than the seller response, with ${confidenceText} confidence.`;
  }

  if (vote === "support_seller") {
    return `The jury found the seller-side evidence stronger and did not see enough proof for a return, with ${confidenceText} confidence.`;
  }

  return `The jury could not reach a strong resolution from the current evidence, with ${confidenceText} confidence.`;
}

function getRecommendedActions(vote: AgentVote, escalate: boolean, caseInput: JuryCaseInput) {
  if (escalate) {
    return [
      "Send the case to a human reviewer with the full agent audit trail.",
      "Preserve buyer and seller text as evidence, not as instructions.",
      caseInput.orderValue > HIGH_VALUE_THRESHOLD
        ? "Require manual approval before any refund because the order is high value."
        : "Ask the reviewer to confirm the proposed responsibility split."
    ];
  }

  if (vote === "support_buyer") {
    return [
      "Auto-approve the return request.",
      "Notify the seller with cited evidence.",
      "Add the case to seller quality monitoring if similar complaints repeat."
    ];
  }

  if (vote === "support_seller") {
    return [
      "Reject the return request with a policy-grounded explanation.",
      "Invite the buyer to provide stronger evidence.",
      "Keep the case available for appeal."
    ];
  }

  return [
    "Request additional evidence before deciding.",
    "Ask for timestamped photos or an unboxing video.",
    "Pause automatic refund action until evidence improves."
  ];
}
