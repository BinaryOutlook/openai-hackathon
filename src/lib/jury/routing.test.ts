import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import {
  AUTO_DECISION_CONFIDENCE_THRESHOLD,
  PROVISIONAL_DECISION_COOLDOWN_SECONDS,
  detectHardEscalation,
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
  });

  it("routes valid in-scope seven-day no-reason returns to standard automation", () => {
    const caseInput = {
      ...demoCase("case-uncontested-no-reason"),
      sellerAgreesToReturn: false,
      sellerResponse: "Seller has no objection to the platform return window."
    };

    expect(isUncontestedCase(caseInput)).toBe(true);
    expect(selectRoute({ caseInput }).routeKind).toBe("standard_automation");
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
});

function demoCase(id: string) {
  const caseInput = DEMO_CASES.find((demoCase) => demoCase.id === id);

  if (!caseInput) {
    throw new Error(`Missing demo case: ${id}`);
  }

  return caseInput;
}
