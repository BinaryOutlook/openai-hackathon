import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "@/lib/jury/demo-cases";
import { runMockJury } from "@/lib/jury/mock";
import { PROVISIONAL_DECISION_COOLDOWN_SECONDS } from "@/lib/jury/routing";
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
    expect(result.audit.juryMode).toBe("not_run");
    expect(result.audit.evidenceIds).toEqual(["E1", "E2"]);
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
