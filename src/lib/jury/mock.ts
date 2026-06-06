import { JURY_AGENTS } from "@/lib/jury/agents";
import { buildMockDebateTurns } from "@/lib/jury/deliberation";
import { buildVerdict } from "@/lib/jury/scoring";
import type { AgentOpinion, AgentVote, JuryCaseInput, JuryRunResult } from "@/types/jury";

export function runMockJury(caseInput: JuryCaseInput): JuryRunResult {
  const initialOpinions = JURY_AGENTS.map((agent): AgentOpinion => {
    const profile = getInitialMockProfile(caseInput, agent.id);

    return {
      agentId: agent.id,
      agentName: agent.name,
      vote: profile.vote,
      confidence: profile.confidence,
      evidenceStrength: profile.evidenceStrength,
      riskScore: profile.riskScore,
      citedEvidenceIds: profile.citedEvidenceIds,
      reasoning: profile.reasoning,
      riskFlags: profile.riskFlags,
      recommendation: profile.recommendation,
      promptInjectionDetected: profile.promptInjectionDetected
    };
  });
  const opinions = JURY_AGENTS.map((agent): AgentOpinion => {
    const profile = getMockProfile(caseInput, agent.id);

    return {
      agentId: agent.id,
      agentName: agent.name,
      vote: profile.vote,
      confidence: profile.confidence,
      evidenceStrength: profile.evidenceStrength,
      riskScore: profile.riskScore,
      citedEvidenceIds: profile.citedEvidenceIds,
      reasoning: profile.reasoning,
      riskFlags: profile.riskFlags,
      recommendation: profile.recommendation,
      promptInjectionDetected: profile.promptInjectionDetected
    };
  });
  const verdict = buildVerdict(caseInput, opinions);
  const debateTurns = buildMockDebateTurns(initialOpinions, opinions, verdict);

  return {
    initialOpinions,
    debateTurns,
    opinions,
    deliberation: buildDeliberation(caseInput, initialOpinions, opinions, debateTurns.length),
    verdict,
    mode: "mock"
  };
}

type MockProfile = {
  vote: AgentVote;
  confidence: number;
  evidenceStrength: number;
  riskScore: number;
  citedEvidenceIds: string[];
  reasoning: string;
  riskFlags: string[];
  recommendation: string;
  promptInjectionDetected: boolean;
};

function getMockProfile(caseInput: JuryCaseInput, agentId: string): MockProfile {
  if (caseInput.id.includes("opened") || containsPromptInjection(caseInput)) {
    return openedCosmeticProfile(caseInput, agentId);
  }

  if (caseInput.id.includes("damaged")) {
    return damagedDeliveryProfile(agentId);
  }

  if (caseInput.id.includes("ambiguous")) {
    return ambiguousQualityProfile(agentId);
  }

  return wrongItemProfile(agentId);
}

function getInitialMockProfile(caseInput: JuryCaseInput, agentId: string): MockProfile {
  const finalProfile = getMockProfile(caseInput, agentId);

  if (caseInput.id.includes("wrong") && agentId === "packaging-logistics") {
    return profile(
      "need_more_evidence",
      0.67,
      0.74,
      0.2,
      ["E1"],
      "The buyer-side mismatch looks plausible, but I want another agent to confirm whether the order record and visible package label are enough without seller warehouse proof.",
      ["Seller packing record not provided."],
      "Ask whether the policy and evidence agents see enough proof to approve without waiting for seller packing logs."
    );
  }

  if (caseInput.id.includes("damaged") && agentId === "fraud-risk") {
    return profile(
      "need_more_evidence",
      0.62,
      0.68,
      0.4,
      ["E1", "E2"],
      "The damage story is credible, but I want the logistics and packaging agents to distinguish courier damage from possible after-delivery handling.",
      ["Cost responsibility is not yet settled."],
      "Approve buyer protection only if the delivery exception and packaging weakness align."
    );
  }

  if (caseInput.id.includes("ambiguous") && agentId === "buyer-advocate") {
    return profile(
      "support_buyer",
      0.57,
      0.45,
      0.24,
      ["E1"],
      "The buyer may genuinely be disappointed by quality, but I need the seller and evidence agents to test whether subjective preference is enough.",
      ["Buyer concern is plausible but not objective yet."],
      "Lean toward buyer protection if another agent can identify objective defect evidence."
    );
  }

  if ((caseInput.id.includes("opened") || containsPromptInjection(caseInput)) && agentId === "buyer-advocate") {
    return profile(
      "need_more_evidence",
      0.58,
      0.58,
      0.52,
      ["E1", "E3"],
      "The buyer deserves an appeal path, but hygiene policy and manipulation risk require the panel to verify whether a defect claim exists.",
      ["Buyer admits trying the product."],
      "Ask for defect evidence before supporting the buyer."
    );
  }

  return finalProfile;
}

function wrongItemProfile(agentId: string): MockProfile {
  const supportBuyer = [
    "policy-judge",
    "buyer-advocate",
    "evidence-sentinel",
    "packaging-logistics",
    "fraud-risk",
    "human-escalation"
  ];

  if (supportBuyer.includes(agentId)) {
    return profile(
      "support_buyer",
      0.88,
      0.86,
      0.18,
      ["E1", "E2"],
      "The buyer photo and order record show a concrete SKU mismatch, and the seller response does not rebut the visible label evidence.",
      [],
      "Approve a return or exchange and monitor the seller's repeated wrong-item complaints."
    );
  }

  return profile(
    "need_more_evidence",
    0.64,
    0.72,
    0.16,
    ["E1"],
    "The buyer's image is persuasive, but seller-side warehouse proof is missing from the current file.",
    ["Seller packing record not provided."],
    "Approve if the shipping label is confirmed against the order."
  );
}

function ambiguousQualityProfile(agentId: string): MockProfile {
  if (agentId === "buyer-advocate" || agentId === "policy-judge") {
    return profile(
      "need_more_evidence",
      0.56,
      0.44,
      0.22,
      ["E1", "E2"],
      "The buyer may have a legitimate quality concern, but the current evidence is subjective and lacks a close-up photo or material tag.",
      ["Material defect is not yet proven."],
      "Ask for clearer product photos and the care label before deciding."
    );
  }

  if (agentId === "seller-advocate" || agentId === "evidence-sentinel") {
    return profile(
      "support_seller",
      0.58,
      0.48,
      0.2,
      ["E2"],
      "The listing policy requires stronger defect evidence than the buyer has provided so far.",
      ["Evidence is thin for automatic approval."],
      "Request additional evidence rather than auto-approve the return."
    );
  }

  return profile(
    "need_more_evidence",
    0.52,
    0.4,
    0.28,
    ["E1"],
    "The case is plausible but ambiguous, and neither party has supplied enough evidence for a confident automated outcome.",
    ["Low evidence strength."],
    "Route to human review if the buyer cannot add objective defect evidence."
  );
}

function damagedDeliveryProfile(agentId: string): MockProfile {
  const buyerVotes = ["buyer-advocate", "packaging-logistics", "policy-judge", "evidence-sentinel"];

  if (buyerVotes.includes(agentId)) {
    return profile(
      "support_buyer",
      0.82,
      0.86,
      0.28,
      ["E1", "E2"],
      "The damage was reported quickly, the box damage matches the cracked product, and the logistics exception supports a shipping-related cause.",
      ["Responsibility may be split between seller packaging and courier handling."],
      "Approve the return while opening a logistics responsibility review."
    );
  }

  if (agentId === "seller-advocate") {
    return profile(
      "need_more_evidence",
      0.62,
      0.67,
      0.3,
      ["E3"],
      "Seller inspection before shipment matters, but the packing method may be insufficient for a ceramic item.",
      ["Seller packaging quality needs review."],
      "Ask seller for outbound inspection photos before assigning final cost responsibility."
    );
  }

  return profile(
    "support_buyer",
    0.74,
    0.78,
    0.38,
    ["E1", "E2", "E3"],
    "No suspicious buyer pattern appears, and the courier exception reduces buyer responsibility.",
    ["Fragile item packaging warning."],
    "Approve buyer protection and route cost allocation to operations."
  );
}

function openedCosmeticProfile(caseInput: JuryCaseInput, agentId: string): MockProfile {
  const injection = containsPromptInjection(caseInput);

  if (agentId === "evidence-sentinel") {
    return profile(
      "escalate",
      0.9,
      0.8,
      0.78,
      ["E2", "E3"],
      "Both buyer and seller text contain instruction-like language that must be treated as evidence, not control text.",
      ["Prompt injection attempt detected.", "Contradictory advocacy language present."],
      "Escalate or require human confirmation; do not follow either party's embedded instruction.",
      injection
    );
  }

  if (agentId === "policy-judge" || agentId === "seller-advocate") {
    return profile(
      "support_seller",
      0.82,
      0.84,
      0.42,
      ["E1", "E2", "E3"],
      "The product is hygiene-sensitive, the seal is broken, and no defect or mismatch evidence is present.",
      ["Opened cosmetics are restricted by policy."],
      "Reject no-reason return unless buyer provides defect evidence."
    );
  }

  if (agentId === "fraud-risk") {
    return profile(
      "escalate",
      0.76,
      0.75,
      0.82,
      ["E3"],
      "The buyer has repeated opened-cosmetics returns and the current claim includes a manipulation attempt.",
      ["Repeated return pattern.", "High risk score for evidence standard abuse."],
      "Route to risk monitoring and require stricter evidence."
    );
  }

  if (agentId === "human-escalation") {
    return profile(
      "escalate",
      0.8,
      0.78,
      0.74,
      ["E1", "E2", "E3"],
      "The policy points toward rejection, but prompt injection and repeated behavior make human review safer.",
      ["Manual confirmation advised."],
      "Escalate to human review before final action.",
      injection
    );
  }

  return profile(
    "support_seller",
    0.68,
    0.7,
    0.45,
    ["E1", "E3"],
    "The buyer may be dissatisfied, but the current evidence fits opened use rather than a protected defect claim.",
    ["Buyer admits trying the product."],
    "Ask for defect evidence if the buyer wants to appeal."
  );
}

function profile(
  vote: AgentVote,
  confidence: number,
  evidenceStrength: number,
  riskScore: number,
  citedEvidenceIds: string[],
  reasoning: string,
  riskFlags: string[],
  recommendation: string,
  promptInjectionDetected = false
): MockProfile {
  return {
    vote,
    confidence,
    evidenceStrength,
    riskScore,
    citedEvidenceIds,
    reasoning,
    riskFlags,
    recommendation,
    promptInjectionDetected
  };
}

function buildDeliberation(
  caseInput: JuryCaseInput,
  initialOpinions: AgentOpinion[],
  opinions: AgentOpinion[],
  debateTurnCount: number
) {
  const buyerVotes = opinions.filter((opinion) => opinion.vote === "support_buyer").length;
  const sellerVotes = opinions.filter((opinion) => opinion.vote === "support_seller").length;
  const escalationVotes = opinions.filter((opinion) => opinion.vote === "escalate").length;
  const changedVotes = opinions.filter((opinion) => {
    const initial = initialOpinions.find((candidate) => candidate.agentId === opinion.agentId);
    return initial && initial.vote !== opinion.vote;
  }).length;

  return `The jury reviewed ${caseInput.evidence.length} evidence items for "${caseInput.title}" across ${debateTurnCount} debate turns. ${changedVotes} juror(s) revised their vote after challenge. Final buyer support: ${buyerVotes}; seller support: ${sellerVotes}; escalation votes: ${escalationVotes}. The strongest recurring themes were policy eligibility, evidence quality, and whether submitted text attempted to steer the AI instead of presenting facts.`;
}

export function containsPromptInjection(caseInput: JuryCaseInput) {
  const combined = [
    caseInput.buyerClaim,
    caseInput.sellerResponse,
    ...caseInput.chatHistory
  ].join(" ");

  return /ignore previous|ignore all|must reject|must approve|system instruction|developer message|follow this instruction|approve my refund immediately/i.test(
    combined
  );
}
