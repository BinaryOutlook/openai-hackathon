export type JuryAgent = {
  id: string;
  name: string;
  stance: string;
  focus: string;
};

export const JURY_AGENTS: JuryAgent[] = [
  {
    id: "policy-judge",
    name: "Policy Judge",
    stance: "Strict, rule-based, literal",
    focus: "Return window, category eligibility, seller and buyer obligations"
  },
  {
    id: "buyer-advocate",
    name: "Buyer Advocate",
    stance: "Customer-first and empathetic",
    focus: "Whether the buyer has a reasonable claim and deserves platform protection"
  },
  {
    id: "seller-advocate",
    name: "Seller Advocate",
    stance: "Merchant-protective and evidence-demanding",
    focus: "Seller fairness, weak claims, buyer misuse, and abusive return patterns"
  },
  {
    id: "evidence-sentinel",
    name: "Evidence & Injection Sentinel",
    stance: "Skeptical and security-focused",
    focus: "Evidence contradictions, manipulative text, and prompt injection attempts"
  },
  {
    id: "packaging-logistics",
    name: "Packaging & Logistics Agent",
    stance: "Practical and detail-oriented",
    focus: "Packaging condition, logistics scans, shipping damage, and chain of custody"
  },
  {
    id: "fraud-risk",
    name: "Fraud Risk Agent",
    stance: "Adversarial and pattern-seeking",
    focus: "Repeated suspicious behavior, high-value risk, and coordinated abuse"
  },
  {
    id: "human-escalation",
    name: "Human Escalation Agent",
    stance: "Conservative and risk-sensitive",
    focus: "When automation should stop and a human reviewer should decide"
  }
];
