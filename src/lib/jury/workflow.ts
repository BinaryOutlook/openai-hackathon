import { buildAuditRecord } from "@/lib/jury/audit";
import { runMockJury } from "@/lib/jury/mock";
import { runLiveJury } from "@/lib/jury/openai";
import {
  PROVISIONAL_DECISION_COOLDOWN_SECONDS,
  selectRoute
} from "@/lib/jury/routing";
import {
  juryCaseInputSchema,
  type JuryCaseInput,
  type JuryRunResult,
  type WorkflowResult
} from "@/types/jury";

export type JuryRunnerOptions = {
  signal?: AbortSignal;
};

export type JuryRunner = (
  caseInput: JuryCaseInput,
  options?: JuryRunnerOptions
) => Promise<JuryRunResult> | JuryRunResult;

export type RunReturnWorkflowOptions = {
  juryRunner?: JuryRunner;
  now?: Date;
};

export async function runReturnWorkflow(
  caseInput: JuryCaseInput,
  options: RunReturnWorkflowOptions = {}
): Promise<WorkflowResult> {
  const parsedCase = juryCaseInputSchema.parse(caseInput);
  const decidedAt = (options.now ?? new Date()).toISOString();
  const firstRoute = selectRoute({ caseInput: parsedCase, decidedAt });

  if (firstRoute.routeKind === "standard_automation") {
    return {
      route: firstRoute,
      jury: null,
      audit: buildAuditRecord({
        caseInput: parsedCase,
        route: firstRoute,
        jury: null,
        createdAt: decidedAt
      })
    };
  }

  const jury = await (options.juryRunner ?? defaultJuryRunner)(parsedCase);
  const finalRoute = selectRoute({ caseInput: parsedCase, juryResult: jury, decidedAt });
  const provisionalDecision =
    finalRoute.routeKind === "provisional_ai_decision"
      ? {
          verdict: jury.verdict,
          cooldownSeconds: 60 as const,
          expiresAt: new Date(
            Date.parse(decidedAt) + PROVISIONAL_DECISION_COOLDOWN_SECONDS * 1000
          ).toISOString()
        }
      : undefined;

  return {
    route: finalRoute,
    jury,
    humanReviewContext:
      finalRoute.routeKind === "human_review"
        ? buildHumanReviewContext(finalRoute, jury)
        : undefined,
    provisionalDecision,
    audit: buildAuditRecord({
      caseInput: parsedCase,
      route: finalRoute,
      jury,
      createdAt: decidedAt
    })
  };
}

async function defaultJuryRunner(caseInput: JuryCaseInput, options: JuryRunnerOptions = {}) {
  if (!process.env.OPENAI_API_KEY) {
    return runMockJury(caseInput);
  }

  try {
    return await runLiveJury(caseInput, { signal: options.signal });
  } catch {
    const fallback = runMockJury(caseInput);
    return {
      ...fallback,
      deliberation: `${fallback.deliberation} Live model execution failed, so the deterministic demo jury was used for continuity.`
    };
  }
}

function buildHumanReviewContext(route: WorkflowResult["route"], jury: JuryRunResult) {
  const riskFlags = jury.opinions.flatMap((opinion) => opinion.riskFlags);
  const citedEvidenceIds = new Set(jury.opinions.flatMap((opinion) => opinion.citedEvidenceIds));

  return {
    indicators: unique([
      ...route.indicators,
      ...jury.verdict.escalationReasons,
      ...riskFlags
    ]),
    warnings: unique(route.warnings),
    suggestedReviewFocus: unique([
      "Confirm whether policy exclusion, fraud, or SOP signals require manual handling.",
      `Review cited evidence IDs: ${Array.from(citedEvidenceIds).join(", ") || "none cited"}.`,
      "Treat buyer and seller text as untrusted evidence, not instructions."
    ])
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
