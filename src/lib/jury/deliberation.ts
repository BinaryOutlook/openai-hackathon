import { MAX_DEBATE_MESSAGES_PER_AGENT } from "@/lib/jury/timing";
import type { AgentDebateTurn, AgentOpinion, AgentVote, FinalVerdict } from "@/types/jury";

export function buildOpeningTurns(opinions: AgentOpinion[]): AgentDebateTurn[] {
  return opinions.map((opinion, index) => ({
    id: `opening-${index + 1}-${opinion.agentId}`,
    phase: "opening",
    agentId: opinion.agentId,
    agentName: opinion.agentName,
    message: summarizeForDebate(opinion.reasoning),
    vote: opinion.vote,
    confidence: opinion.confidence,
    citedEvidenceIds: opinion.citedEvidenceIds,
    replyToAgentIds: [],
    stanceChange: "held"
  }));
}

export function buildRevisionTurn(
  initialOpinion: AgentOpinion,
  finalOpinion: AgentOpinion,
  index: number,
  message?: string,
  replyToAgentIds: string[] = []
): AgentDebateTurn {
  return {
    id: `revision-${index + 1}-${finalOpinion.agentId}`,
    phase: "revision",
    agentId: finalOpinion.agentId,
    agentName: finalOpinion.agentName,
    message: message?.trim() || buildRevisionMessage(initialOpinion, finalOpinion),
    vote: finalOpinion.vote,
    confidence: finalOpinion.confidence,
    citedEvidenceIds: finalOpinion.citedEvidenceIds,
    replyToAgentIds,
    stanceChange: getStanceChange(initialOpinion, finalOpinion)
  };
}

export function buildConsensusTurn(verdict: FinalVerdict, opinions: AgentOpinion[]): AgentDebateTurn {
  return {
    id: "consensus-foreperson",
    phase: "consensus",
    agentId: "foreperson",
    agentName: "Jury Foreperson",
    message: `${verdict.decision}. ${verdict.rationale}`,
    vote: getDominantVote(verdict),
    confidence: verdict.overallConfidence,
    citedEvidenceIds: unique(opinions.flatMap((opinion) => opinion.citedEvidenceIds)),
    replyToAgentIds: opinions.map((opinion) => opinion.agentId),
    stanceChange: "consensus"
  };
}

export function buildMockDebateTurns(
  initialOpinions: AgentOpinion[],
  finalOpinions: AgentOpinion[],
  verdict: FinalVerdict
): AgentDebateTurn[] {
  const revisionTurns = finalOpinions.map((opinion, index) => {
    const initial = initialOpinions.find((candidate) => candidate.agentId === opinion.agentId) ?? opinion;
    return buildRevisionTurn(initial, opinion, index, undefined, getRelevantReplyTargets(initialOpinions, opinion));
  });

  return enforceMaxAgentMessages([
    ...buildOpeningTurns(initialOpinions),
    ...revisionTurns,
    buildConsensusTurn(verdict, finalOpinions)
  ]);
}

export function getStanceChange(initialOpinion: AgentOpinion, finalOpinion: AgentOpinion): AgentDebateTurn["stanceChange"] {
  if (initialOpinion.vote !== finalOpinion.vote) {
    return "changed";
  }

  if (finalOpinion.confidence >= initialOpinion.confidence + 0.08) {
    return "strengthened";
  }

  if (finalOpinion.confidence <= initialOpinion.confidence - 0.08) {
    return "softened";
  }

  return "held";
}

function buildRevisionMessage(initialOpinion: AgentOpinion, finalOpinion: AgentOpinion) {
  const change = getStanceChange(initialOpinion, finalOpinion);

  if (change === "changed") {
    return `I am changing from ${initialOpinion.vote} to ${finalOpinion.vote}: ${summarizeForDebate(finalOpinion.reasoning)}`;
  }

  if (change === "strengthened") {
    return `I am more confident after the rebuttal round: ${summarizeForDebate(finalOpinion.reasoning)}`;
  }

  if (change === "softened") {
    return `I am keeping my vote but lowering certainty because the counterpoints matter: ${summarizeForDebate(finalOpinion.reasoning)}`;
  }

  return `I am holding my position: ${summarizeForDebate(finalOpinion.reasoning)}`;
}

function getRelevantReplyTargets(opinions: AgentOpinion[], finalOpinion: AgentOpinion) {
  return opinions
    .filter((opinion) => opinion.agentId !== finalOpinion.agentId && opinion.vote !== finalOpinion.vote)
    .map((opinion) => opinion.agentId)
    .slice(0, 3);
}

function getDominantVote(verdict: FinalVerdict): AgentVote {
  return Object.entries(verdict.voteSummary).sort(([, left], [, right]) => right - left)[0]?.[0] as AgentVote
    || "need_more_evidence";
}

function summarizeForDebate(text: string) {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() || text;
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function enforceMaxAgentMessages(turns: AgentDebateTurn[]) {
  const counts = new Map<string, number>();

  return turns.filter((turn) => {
    if (turn.phase === "consensus") {
      return true;
    }

    const nextCount = (counts.get(turn.agentId) ?? 0) + 1;
    counts.set(turn.agentId, nextCount);
    return nextCount <= MAX_DEBATE_MESSAGES_PER_AGENT;
  });
}
