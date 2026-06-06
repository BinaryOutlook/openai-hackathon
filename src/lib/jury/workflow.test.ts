import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { runMockJury } from "@/lib/jury/mock";
import { PROVISIONAL_DECISION_COOLDOWN_SECONDS } from "@/lib/jury/routing";
import { MAX_DEBATE_MESSAGES_PER_AGENT } from "@/lib/jury/timing";
import { runReturnWorkflow, type JuryRunner } from "@/lib/jury/workflow";

const NOW = new Date("2026-06-01T12:00:00.000Z");

describe("return workflow", () => {
  it("does not call the jury for standard automation", async () => {
    let calls = 0;
    const result = await runReturnWorkflow(demoCase("case-uncontested-no-reason"), {
      now: NOW,
      juryRunner: () => {
        calls += 1;
        return runMockJury(demoCase("case-wrong-item"));
      }
    });

    expect(calls).toBe(0);
    expect(result.route.routeKind).toBe("standard_automation");
    expect(result.jury).toBeNull();
    expect(result.provisionalDecision).toBeUndefined();
    expect(result.humanReviewContext).toBeUndefined();
    expect(result.audit.juryMode).toBe("not_run");
    expect(result.audit.evidenceIds).toEqual(["E1", "E2"]);
    expect(result.audit.finalDecision).toContain("seller consent");
  });

  it("runs the jury for hard human-review routes and returns review context", async () => {
    let calls = 0;
    const result = await runReturnWorkflow(demoCase("case-opened-no-reason"), {
      now: NOW,
      juryRunner: countingMockRunner(() => {
        calls += 1;
      })
    });

    expect(calls).toBe(1);
    expect(result.route.routeKind).toBe("human_review");
    expect(result.jury?.mode).toBe("mock");
    expect(result.jury?.initialOpinions).toHaveLength(7);
    expect(result.jury?.debateTurns.some((turn) => turn.phase === "consensus")).toBe(true);
    expect(result.humanReviewContext?.warnings).toContain("Prompt injection attempt");
    expect(result.audit.finalDecision).toBe("Human reviewer owns the final decision.");
  });

  it("routes low confidence jury output to human review", async () => {
    const result = await runReturnWorkflow(demoCase("case-ambiguous-quality"), {
      now: NOW,
      juryRunner: (caseInput) => {
        const jury = runMockJury(caseInput);
        return {
          ...jury,
          verdict: {
            ...jury.verdict,
            overallConfidence: 0.42,
            escalate: false,
            escalationReasons: []
          }
        };
      }
    });

    expect(result.route.routeKind).toBe("human_review");
    expect(result.route.routingReason).toContain("below the threshold");
    expect(result.humanReviewContext?.suggestedReviewFocus.length).toBeGreaterThan(0);
  });

  it("creates provisional decision cooldown metadata for confident jury output", async () => {
    const result = await runReturnWorkflow(demoCase("case-wrong-item"), {
      now: NOW,
      juryRunner: (caseInput) => {
        const jury = runMockJury(caseInput);
        return {
          ...jury,
          verdict: {
            ...jury.verdict,
            overallConfidence: 0.86,
            escalate: false,
            escalationReasons: []
          }
        };
      }
    });

    expect(result.route.routeKind).toBe("provisional_ai_decision");
    expect(result.provisionalDecision?.cooldownSeconds).toBe(PROVISIONAL_DECISION_COOLDOWN_SECONDS);
    expect(result.provisionalDecision?.expiresAt).toBe("2026-06-01T12:01:00.000Z");
    expect(result.audit.verdict?.decision).toBe("Approve buyer return");
  });

  it("keeps the debate transcript to at most two messages per agent before consensus", async () => {
    const result = await runReturnWorkflow(demoCase("case-wrong-item"), {
      now: NOW,
      juryRunner: (caseInput) => runMockJury(caseInput)
    });
    const messageCounts = new Map<string, number>();

    for (const turn of result.jury?.debateTurns ?? []) {
      if (turn.phase !== "consensus") {
        messageCounts.set(turn.agentId, (messageCounts.get(turn.agentId) ?? 0) + 1);
      }
    }

    expect(MAX_DEBATE_MESSAGES_PER_AGENT).toBe(2);
    expect(Math.max(...messageCounts.values())).toBeLessThanOrEqual(MAX_DEBATE_MESSAGES_PER_AGENT);
    expect(result.jury?.debateTurns.at(-1)?.phase).toBe("consensus");
  });

  it("pins the extended extreme demo cases to stable outcomes", async () => {
    const cases = [
      {
        id: "case-extreme-buyer-abuse",
        routeKind: "human_review",
        warning: "Potential fraud indicator",
        decision: "Escalate to human review",
        dominantVote: "support_seller"
      },
      {
        id: "case-extreme-seller-misconduct",
        routeKind: "provisional_ai_decision",
        warning: null,
        decision: "Approve buyer return",
        dominantVote: "support_buyer"
      },
      {
        id: "case-obvious-logistics-fault",
        routeKind: "provisional_ai_decision",
        warning: null,
        decision: "Approve buyer return",
        dominantVote: "support_buyer"
      },
      {
        id: "case-high-value-authenticity",
        routeKind: "human_review",
        warning: "High-value item",
        decision: "Escalate to human review",
        dominantVote: "support_buyer"
      },
      {
        id: "case-seller-prompt-manipulation",
        routeKind: "human_review",
        warning: "Prompt injection attempt",
        decision: "Escalate to human review",
        dominantVote: "support_buyer"
      }
    ] as const;

    for (const demo of cases) {
      const result = await runReturnWorkflow(demoCase(demo.id), {
        now: NOW,
        juryRunner: (caseInput) => runMockJury(caseInput)
      });

      expect(result.route.routeKind).toBe(demo.routeKind);
      expect(result.jury?.verdict.decision).toBe(demo.decision);
      expect(result.jury?.verdict.voteSummary[demo.dominantVote]).toBeGreaterThanOrEqual(4);

      if (demo.warning) {
        expect(result.route.warnings).toContain(demo.warning);
      } else {
        expect(result.route.warnings).toEqual([]);
      }
    }
  });
});

function demoCase(id: string) {
  const caseInput = DEMO_CASES.find((demoCase) => demoCase.id === id);

  if (!caseInput) {
    throw new Error(`Missing demo case: ${id}`);
  }

  return caseInput;
}

function countingMockRunner(onCall: () => void): JuryRunner {
  return (caseInput) => {
    onCall();
    return runMockJury(caseInput);
  };
}
