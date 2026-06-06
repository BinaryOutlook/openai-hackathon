import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import {
  AUTO_DECISION_CONFIDENCE_THRESHOLD,
  PROVISIONAL_DECISION_COOLDOWN_SECONDS,
  detectHardEscalation,
  getStandardAutomationClause,
  isUncontestedCase,
  selectRoute
} from "@/lib/jury/routing";

describe("return routing", () => {
  it("routes buyer/seller agreement to standard automation without jury", () => {
    const caseInput = demoCase("case-uncontested-no-reason");
    const decision = selectRoute({ caseInput, decidedAt: "2026-06-01T00:00:00.000Z" });

    expect(isUncontestedCase(caseInput)).toBe(true);
    expect(decision.routeKind).toBe("standard_automation");
    expect(decision.requiresJury).toBe(false);
    expect(decision.cooldownSeconds).toBeNull();
    expect(getStandardAutomationClause(caseInput)?.id).toBe("seller_consent");
  });

  it("routes valid in-scope seven-day no-reason returns to standard automation", () => {
    const caseInput = {
      ...demoCase("case-uncontested-no-reason"),
      sellerAgreesToReturn: false,
      sellerResponse: "Seller has no objection to the platform return window."
    };

    expect(isUncontestedCase(caseInput)).toBe(true);
    expect(selectRoute({ caseInput }).routeKind).toBe("standard_automation");
    expect(getStandardAutomationClause(caseInput)?.id).toBe("seven_day_policy");
  });

  it("keeps the seven-day boundary but rejects day eight", () => {
    const daySeven = {
      ...demoCase("case-uncontested-no-reason"),
      sellerAgreesToReturn: false,
      deliveryDate: "2026-05-01",
      returnRequestDate: "2026-05-08",
      sellerResponse: "Seller has no objection to the platform return window."
    };
    const dayEight = {
      ...daySeven,
      returnRequestDate: "2026-05-09"
    };

    expect(isUncontestedCase(daySeven)).toBe(true);
    expect(isUncontestedCase(dayEight)).toBe(false);
  });

  it("does not bypass the jury when evidence is missing or the seller disputes eligibility", () => {
    const missingEvidence = {
      ...demoCase("case-uncontested-no-reason"),
      evidence: []
    };
    const sellerDispute = {
      ...demoCase("case-uncontested-no-reason"),
      sellerAgreesToReturn: false,
      sellerResponse: "Seller disputes eligibility and requests proof before approving."
    };

    expect(isUncontestedCase(missingEvidence)).toBe(false);
    expect(isUncontestedCase(sellerDispute)).toBe(false);
  });

  it("routes fraud, prompt injection, and return exclusions to human review", () => {
    const caseInput = demoCase("case-opened-no-reason");
    const signals = detectHardEscalation(caseInput);
    const decision = selectRoute({ caseInput });

    expect(signals.map((signal) => signal.id)).toEqual(
      expect.arrayContaining(["prompt_injection", "return_exclusion", "fraud_risk"])
    );
    expect(decision.routeKind).toBe("human_review");
    expect(decision.requiresJury).toBe(true);
  });

  it("routes low AI confidence to human review", () => {
    const decision = selectRoute({
      caseInput: demoCase("case-wrong-item"),
      confidence: AUTO_DECISION_CONFIDENCE_THRESHOLD - 0.01
    });

    expect(decision.routeKind).toBe("human_review");
    expect(decision.warnings[0]).toContain("below");
  });

  it("routes sufficient confidence without hard triggers to provisional AI decision", () => {
    const decision = selectRoute({
      caseInput: demoCase("case-wrong-item"),
      confidence: AUTO_DECISION_CONFIDENCE_THRESHOLD + 0.05
    });

    expect(decision.routeKind).toBe("provisional_ai_decision");
    expect(decision.cooldownSeconds).toBe(PROVISIONAL_DECISION_COOLDOWN_SECONDS);
  });

  it("allows the exact confidence threshold for provisional decisions", () => {
    const decision = selectRoute({
      caseInput: demoCase("case-wrong-item"),
      confidence: AUTO_DECISION_CONFIDENCE_THRESHOLD
    });

    expect(decision.routeKind).toBe("provisional_ai_decision");
  });

  it("lets high-value risk override seller consent", () => {
    const caseInput = {
      ...demoCase("case-uncontested-no-reason"),
      orderValue: 501
    };
    const decision = selectRoute({ caseInput });

    expect(isUncontestedCase(caseInput)).toBe(false);
    expect(decision.routeKind).toBe("human_review");
    expect(decision.warnings).toContain("High-value item");
  });
});

function demoCase(id: string) {
  const caseInput = DEMO_CASES.find((demoCase) => demoCase.id === id);

  if (!caseInput) {
    throw new Error(`Missing demo case: ${id}`);
  }

  return caseInput;
}
