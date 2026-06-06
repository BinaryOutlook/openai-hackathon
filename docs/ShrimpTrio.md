Shrimp Trio Update





Manual user review:

1. It's good to hav two page the main HUD and the Judge jury page, but idealise the indicators all take up too much space in the main hud, and hence it still feel like two page glued into one. Hence split the top part to a new page next to AI Jury as human review, also, do screenshot validation for the UIUX to be good enough for a bunch of hackathon judge.
2. Also on the AI Jury Panel, The deliberation part is too lengthy considering a lot of width space is wasted. Do some UIUX optimisation and remove repetition stuff, keep concusion but always ensure key numberical metrics and  indicators are present for easier judgement. Also ensure that It's Deliberation part first, followed by the Jury Panel with all the agents. Also with the pre-expansion agent summaries, it's too long, just bold the agent decision and with 2 bullet point total max 20 words. As people always can click full reaosninign anytime





And from auto review:

## Anti-Patterns Verdict

**Partial fail.** It does not have the classic purple/cyan/glassmorphism AI look, which is good. But it still reads somewhat AI-generated because of repeated rounded cards, nested panel grids, icon-label-summary blocks, and uniformly “safe” spacing. The strongest tell is \( \text{everything} \rightarrow \text{card} \rightarrow \text{inner card} \), especially in the HUD and AI Jury views.

## Executive Summary

Audited the only UI route, `/`, across HUD and AI Jury Panel at \(1440\times900\) and \(390\times844\). Also checked all demo routes through the API.

**Issues found:** 12 total: Critical 0, High 5, Medium 5, Low 2.  
**Overall score:** \(74/100\). Strong MVP structure, but accessibility and mobile density need attention.  
**Top risks:** color contrast, tiny tap targets, inert queue filters, export without required human decision, long mobile AI review flow.

Build and tests passed: `next build`, `vitest` \(16/16\).

## Detailed Findings

### Critical Issues

None verified.

### High-Severity Issues

| Issue                                                        | Location                                                     | Impact                                                       | Standard                                     | Recommendation                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------ |
| Brand orange fails contrast repeatedly: white on `#ff5722` is \(3.16:1\), orange on tint is \(2.75:1\), below \(4.5:1\). | [tailwind.config.ts](/Users/leoliang/StudyMain/openai-hackathon/tailwind.config.ts:13), [page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx:281), [workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts:21) | Primary buttons, badges, evidence IDs, and “Full reasoning” links are hard to read. | WCAG 1.4.3 Contrast                          | Use darker accessible text tokens, e.g. active orange/charcoal for text; reserve bright orange for fills/large marks. Suggested: `/colorize`, `/harden`. |
| Touch targets are too small: filter chips are 26px tall, main buttons 40px, edit 36px, summary controls 20px. | [review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx:29), [case-intake.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/case-intake.tsx:46), [ai-jury.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ai-jury.tsx:143) | Mobile and motor-impaired users will mis-tap controls.       | WCAG 2.5.8, mobile \(44\times44\) convention | Raise interactive min-height to 44px, especially on mobile. Suggested: `/harden`. |
| Review Queue filter chips look clickable but do nothing.     | [review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx:12) | Creates false affordance and slows reviewers.                | WCAG 4.1.2 / UX control honesty              | Implement filter state with `aria-pressed`, or render as non-interactive labels. Suggested: `/harden`, `/clarify`. |
| Export is enabled even when the reviewer has not selected a final verdict or rationale. | [page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx:290), [human-review.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/human-review.tsx:90) | Can produce incomplete audit records despite “Complete final verdict and rationale.” | WCAG 3.3.1 / workflow integrity              | Gate export or show inline validation errors. Suggested: `/harden`. |
| Mobile AI Jury view is extremely long: about 6095px for one case. | [ai-jury.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ai-jury.tsx:122), [page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx:397) | Reviewers must scroll through many repeated juror cards before reaching audit context. | Responsive UX                                | Add grouped summaries, jump links, accordions, or sticky audit summary. Suggested: `/arrange`, `/distill`. |

### Medium-Severity Issues

| Issue                                                        | Location                                                     | Impact                                                       | Recommendation |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------- |
| Heavy nested-card visual system.                             | [human-review.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/human-review.tsx:35), [evidence-board.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/evidence-board.tsx:81) | Looks busy and templated; weakens scan hierarchy. Use flatter section bands and fewer inner bordered boxes. `/quieter`, `/arrange`. |                |
| Raw hex colors are scattered through components.             | [workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts:24), [globals.css](/Users/leoliang/StudyMain/openai-hackathon/src/app/globals.css:5) | Theme changes and dark mode will be brittle. Normalize semantic tokens. `/normalize`, `/colorize`. |                |
| Internal scroll traps hide important content.                | [ui.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ui.tsx:16), [review-queue.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/review-queue.tsx:36), [evidence-board.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/evidence-board.tsx:38) | Keyboard and trackpad users face nested scrolling. Prefer page flow or expandable summaries. `/arrange`. |                |
| Tabs use `role="tab"` but lack full tab semantics.           | [workspace-tabs.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/workspace-tabs.tsx:54) | Screen reader/keyboard behavior is incomplete. Add `aria-controls`, tab panels, roving tabindex, arrow-key navigation. `/harden`. |                |
| Uploaded evidence images become base64 state and render without lazy/decoding hints. | [workspace.ts](/Users/leoliang/StudyMain/openai-hackathon/src/app/_lib/workspace.ts:130), [evidence-board.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/hud/evidence-board.tsx:179) | Large uploads can hurt memory and render time. Compress, cap dimensions, use object URLs, add `loading`/`decoding`. `/optimize`. |                |

### Low-Severity Issues

| Issue                                                       | Location                                                     | Impact                                                       | Recommendation |
| ----------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------- |
| “Similar Past Cases” appears twice in AI Jury flow.         | [ai-jury.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/_components/ai-jury.tsx:202), [page.tsx](/Users/leoliang/StudyMain/openai-hackathon/src/app/page.tsx:397) | Redundant content adds scroll. Keep one placement. `/distill`. |                |
| No demo case currently exercises `provisional_ai_decision`. | [demo-cases.ts](/Users/leoliang/StudyMain/openai-hackathon/src/lib/jury/demo-cases.ts:1) | Cooldown UI exists but lacks reliable QA coverage. Add a deterministic provisional case. `/harden`. |                |

## Positive Findings

Good reviewer-first IA: HUD answers case, route, verdict, why, disagreement, and next action.  
Stale computed outputs are hidden during reruns, which protects trust.  
Semantic labels and focus-visible outlines exist.  
No meaningful horizontal overflow on desktop/mobile, except a tiny \(1\text{px}\) mobile AI overflow.  
Evidence aliases \(B1, P1, H1\) are useful and consistent.
