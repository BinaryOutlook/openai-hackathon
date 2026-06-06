import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { containsPromptInjection, runMockJury } from "@/lib/jury/mock";
import {
  calculateOverallConfidence,
  getVoteMargin,
  shouldEscalate,
  summarizeVotes
} from "@/lib/jury/scoring";

describe("jury scoring", () => {
  it("produces a decisive non-escalated verdict for the wrong-item demo case", () => {
    const result = runMockJury(DEMO_CASES[0]);

    expect(result.opinions).toHaveLength(7);
    expect(summarizeVotes(result.opinions).support_buyer).toBe(6);
    expect(getVoteMargin(result.opinions)).toBe(5);
    expect(calculateOverallConfidence(result.opinions)).toBeGreaterThanOrEqual(0.65);
    expect(result.verdict.escalate).toBe(false);
    expect(result.verdict.decision).toBe("Approve buyer return");
  });

  it("escalates when the order is high value even with strong agent confidence", () => {
    const highValueCase = {
      ...DEMO_CASES[0],
      orderValue: 1200
    };
    const result = runMockJury(highValueCase);
    const escalation = shouldEscalate(highValueCase, result.opinions, result.verdict.overallConfidence);

    expect(escalation.escalate).toBe(true);
    expect(escalation.reasons).toContain(
      "The order value exceeds the high-value manual approval threshold."
    );
  });

  it("flags prompt injection as evidence without obeying the injected instruction", () => {
    const caseInput = DEMO_CASES[2];
    const result = runMockJury(caseInput);

    expect(containsPromptInjection(caseInput)).toBe(true);
    expect(result.opinions.some((opinion) => opinion.promptInjectionDetected)).toBe(true);
    expect(result.verdict.escalate).toBe(true);
    expect(result.verdict.decision).toBe("Escalate to human review");
    expect(result.verdict.refundType).not.toBe("Full refund after return received");
  });
});
