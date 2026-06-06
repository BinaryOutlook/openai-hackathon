import { z } from "zod";

export const agentVoteSchema = z.enum([
  "support_buyer",
  "support_seller",
  "need_more_evidence",
  "escalate"
]);

export type AgentVote = z.infer<typeof agentVoteSchema>;

export const evidenceSourceSchema = z.enum([
  "buyer",
  "seller",
  "platform_policy",
  "logistics",
  "history",
  "reviewer"
]);

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

export const requestReasonSchema = z.enum([
  "do_not_want_anymore",
  "description_mismatch",
  "material_mismatch",
  "size_mismatch",
  "production_or_warranty_mismatch",
  "color_style_model_mismatch",
  "quality_issue",
  "missing_item_or_accessory",
  "damaged_or_dirty_item"
]);

export type RequestReason = z.infer<typeof requestReasonSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: evidenceSourceSchema.default("buyer"),
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
  requestReason: requestReasonSchema.default("description_mismatch"),
  sellerAgreesToReturn: z.boolean().default(false),
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

export const agentDebateTurnSchema = z.object({
  id: z.string().min(1),
  phase: z.enum(["opening", "challenge", "revision", "consensus"]),
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  message: z.string().min(1),
  vote: agentVoteSchema,
  confidence: z.number().min(0).max(1),
  citedEvidenceIds: z.array(z.string()).default([]),
  replyToAgentIds: z.array(z.string()).default([]),
  stanceChange: z.enum(["held", "softened", "strengthened", "changed", "consensus"]).default("held")
});

export type AgentDebateTurn = z.infer<typeof agentDebateTurnSchema>;

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
  initialOpinions: z.array(agentOpinionSchema),
  debateTurns: z.array(agentDebateTurnSchema),
  opinions: z.array(agentOpinionSchema),
  deliberation: z.string().min(1),
  verdict: finalVerdictSchema,
  mode: z.enum(["mock", "live"])
});

export type JuryRunResult = z.infer<typeof juryRunResultSchema>;

export const routeKindSchema = z.enum([
  "standard_automation",
  "human_review",
  "provisional_ai_decision"
]);

export type RouteKind = z.infer<typeof routeKindSchema>;

export const escalationSignalSchema = z.object({
  id: z.enum([
    "fraud_risk",
    "prompt_injection",
    "sop_trigger",
    "return_exclusion",
    "high_value",
    "abnormal_history"
  ]),
  label: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["warning", "blocker"]),
  evidenceIds: z.array(z.string()).default([])
});

export type EscalationSignal = z.infer<typeof escalationSignalSchema>;

export const auditTrailEntrySchema = z.object({
  at: z.string().min(1),
  action: z.string().min(1),
  detail: z.string().min(1)
});

export type AuditTrailEntry = z.infer<typeof auditTrailEntrySchema>;

export const routingDecisionSchema = z.object({
  routeKind: routeKindSchema,
  routingReason: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  indicators: z.array(z.string()).default([]),
  requiresJury: z.boolean(),
  confidence: z.number().min(0).max(1).nullable(),
  cooldownSeconds: z.number().int().nonnegative().nullable(),
  auditTrail: z.array(auditTrailEntrySchema).default([])
});

export type RoutingDecision = z.infer<typeof routingDecisionSchema>;

export const humanOverrideSchema = z.object({
  status: z.enum(["none", "submitted"]),
  overrulingPoint: z.string().optional(),
  reviewerId: z.string().optional(),
  submittedAt: z.string().optional()
});

export type HumanOverride = z.infer<typeof humanOverrideSchema>;

export const provisionalDecisionSchema = z.object({
  verdict: finalVerdictSchema,
  cooldownSeconds: z.literal(60),
  expiresAt: z.string().min(1)
});

export type ProvisionalDecision = z.infer<typeof provisionalDecisionSchema>;

export const auditRecordSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  createdAt: z.string().min(1),
  routeKind: routeKindSchema,
  routingReason: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  indicators: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string()).default([]),
  evidenceSources: z.record(z.string(), evidenceSourceSchema),
  requestReason: requestReasonSchema,
  juryMode: z.enum(["mock", "live", "not_run"]),
  verdict: finalVerdictSchema.nullable(),
  humanOverride: humanOverrideSchema.nullable(),
  finalDecision: z.string().min(1)
});

export type AuditRecord = z.infer<typeof auditRecordSchema>;

export const workflowResultSchema = z.object({
  route: routingDecisionSchema,
  jury: juryRunResultSchema.nullable(),
  humanReviewContext: z.object({
    indicators: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    suggestedReviewFocus: z.array(z.string()).default([])
  }).optional(),
  provisionalDecision: provisionalDecisionSchema.optional(),
  audit: auditRecordSchema
});

export type WorkflowResult = z.infer<typeof workflowResultSchema>;
