# AI Return Jury MVP Traits

## MVP Positioning

This MVP is a hackathon-ready product demo for marketplace return dispute operations. It shows how a case can move from structured intake to a multi-agent jury, then into a confidence-aware verdict with escalation logic.

The demo should be presented as an operational decision-support system, not as a fully automated marketplace backend. Its strongest current story is transparency: each agent votes, cites evidence IDs, names risks, and contributes to a final verdict.

## Supported in the Current MVP

| Trait | Current behavior |
| --- | --- |
| Case intake | Loads preset dispute cases and lets the user edit buyer and seller narratives. |
| Evidence board | Displays text, policy, logistics, history, and image evidence summaries. |
| Image upload | Accepts local image evidence in the browser and includes it in the case payload. |
| Multi-agent panel | Runs seven specialized jury roles: policy, buyer, seller, evidence/injection, packaging/logistics, fraud risk, and human escalation. |
| Mock jury mode | Produces deterministic outputs when no OpenAI API key is available, making the demo reliable offline or under API failure. |
| Live jury mode | Uses the OpenAI Responses API when `OPENAI_API_KEY` is configured. |
| Structured output | Validates case input and agent verdict shapes with Zod schemas. |
| Prompt-injection handling | Treats buyer and seller text as evidence, detects instruction-like manipulation, and escalates risky cases. |
| Verdict scoring | Computes vote split, confidence, risk score, responsibility split, escalation reasons, and recommended actions. |
| Export | Downloads the current case and verdict as JSON for audit or review handoff. |

## Not Supported Yet

| Gap | Current limitation |
| --- | --- |
| True deliberation rounds | Agents do not yet read each other's opinions and revise their votes. The foreperson summarizes the first-round opinions. |
| Knowledge retrieval | Policies and histories are supplied directly in the case instead of being retrieved from a policy or precedent database. |
| Persistent operations | There is no database, saved case queue, reviewer assignment, login, role permissions, or audit-history storage. |
| Real workflow execution | Recommended actions do not call refund, notification, seller-risk, logistics, or CRM systems. |
| Full evidence forensics | The MVP does not perform OCR, barcode reading, serial-number matching, video frame extraction, metadata inspection, or fake-evidence detection. |
| Broad custom case authoring | The UI edits the narratives and uploads images, but most structured fields still come from preset cases. |
| Production hardening | Rate limiting, upload size limits, authentication, observability, and deployment secrets policy still need to be added before production use. |

## Scoring Trait

The MVP's verdict confidence is intentionally explainable. It combines average agent confidence, vote margin, evidence strength, and maximum risk:

\[
C = \operatorname{clamp}(0.45\bar{c} + 0.35m + 0.20\bar{e} - 0.25r)
\]

Where \( \bar{c} \) is average agent confidence, \( m \) is normalized vote margin, \( \bar{e} \) is average evidence strength, and \( r \) is the highest risk score across agents.

Escalation is triggered when confidence is low, vote margin is narrow, risk is high, prompt injection is detected, or the order value exceeds the high-value threshold.

## Demo-Ready Storyline

1. Start with the wrong-item case to show a decisive buyer-protective resolution.
2. Switch to the damaged-delivery case to show split responsibility between seller packaging and logistics handling.
3. Switch to the opened-cosmetic case to show policy restriction, repeated buyer risk, and prompt-injection escalation.
4. Upload a local image to demonstrate that the evidence board can accept new visual evidence.
5. Export the verdict JSON to show auditability and reviewer handoff.

## Best Next Increments

| Priority | Increment | Why it matters |
| --- | --- | --- |
| 1 | Add visible first-round and second-round deliberation | This makes the "jury" concept feel real instead of parallel single-pass judging. |
| 2 | Expand editable case fields | Judges can perturb order value, return type, policy, logistics, and histories during the demo. |
| 3 | Add an evidence-extraction step | A lightweight model pass can produce captions, OCR text, damage notes, and cited observations. |
| 4 | Add a human-review queue | This turns the demo from a verdict screen into a miniature operations console. |
| 5 | Add API fallback tests | The mock fallback is important to demo reliability and should be protected by tests. |

## Repo Hygiene

Generated runtime files should stay out of version control: `.next/`, `node_modules/`, build outputs, coverage, test reports, local env files, and generated skill exports. `next-env.d.ts` remains tracked because Next.js projects commonly use it as part of the TypeScript project surface.
