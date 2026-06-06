import { z } from "zod";

export const agentVoteSchema = z.enum([
  "support_buyer",
  "support_seller",
  "need_more_evidence",
  "escalate"
]);

export type AgentVote = z.infer<typeof agentVoteSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["image", "text", "logistics", "policy", "history"]),
  summary: z.string().min(1),
  imageDataUrl: z.string().optional()
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const juryCaseInputSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  returnType: z.string().min(1),
  productTitle: z.string().min(1),
  category: z.string().min(1),
  orderValue: z.number().nonnegative(),
  orderDate: z.string().min(1),
  deliveryDate: z.string().min(1),
  returnRequestDate: z.string().min(1),
  policyText: z.string().min(1),
  buyerClaim: z.string().min(1),
  sellerResponse: z.string().min(1),
  chatHistory: z.array(z.string()).default([]),
  logisticsEvents: z.array(z.string()).default([]),
  buyerHistory: z.string().min(1),
  sellerHistory: z.string().min(1),
  evidence: z.array(evidenceItemSchema).default([])
});

export type JuryCaseInput = z.infer<typeof juryCaseInputSchema>;

export const agentOpinionSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  vote: agentVoteSchema,
  confidence: z.number().min(0).max(1),
  evidenceStrength: z.number().min(0).max(1),
  riskScore: z.number().min(0).max(1),
  citedEvidenceIds: z.array(z.string()).default([]),
  reasoning: z.string().min(1),
  riskFlags: z.array(z.string()).default([]),
  recommendation: z.string().min(1),
  promptInjectionDetected: z.boolean().default(false)
});

export type AgentOpinion = z.infer<typeof agentOpinionSchema>;

export const finalVerdictSchema = z.object({
  decision: z.string().min(1),
  refundType: z.string().min(1),
  responsibility: z.object({
    buyer: z.number().min(0).max(100),
    seller: z.number().min(0).max(100),
    logistics: z.number().min(0).max(100)
  }),
  overallConfidence: z.number().min(0).max(1),
  voteSummary: z.record(agentVoteSchema, z.number()),
  voteMargin: z.number().min(0),
  riskScore: z.number().min(0).max(1),
  escalate: z.boolean(),
  escalationReasons: z.array(z.string()),
  rationale: z.string().min(1),
  recommendedActions: z.array(z.string()).min(1)
});

export type FinalVerdict = z.infer<typeof finalVerdictSchema>;

export const juryRunResultSchema = z.object({
  opinions: z.array(agentOpinionSchema),
  deliberation: z.string().min(1),
  verdict: finalVerdictSchema,
  mode: z.enum(["mock", "live"])
});

export type JuryRunResult = z.infer<typeof juryRunResultSchema>;
