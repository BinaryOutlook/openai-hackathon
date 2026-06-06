User 1:

1. The webpage need a thumbnail logo on bookmark bar

2. Either make a choice of generate text sections supporting markdown formatting with the bolding, or instruct the ai or our display engine to not use markdown formatting , as the "**" is kinda weird

3. Our product act as a AI system, but the user(both buyer and seller) don't need to know so or include it in the claim or response, hence change the demo cases. 

4. It's good that the jury panel with so many judge having extended reply, but also display a bullet point summary for easy glimpsing and only after clicking an expanded section will the full text be displayed for better UX.

5. The case intake box, its good that we got the whole case editable, but we also need to show it's totally buyer seller initiated and written, hence it shall be locked, and only editable when clicking a button next to case intake saying we want to make edits. 

6. When any info have been edited, there should be a text next to Run Workflow saying Changes made to tell the human reviewer that don't take thing as it is, need to run Workflow. Similarly when run workflow have been clicked, every AI generated and computed section should be PENDING or waiting for response with one good indicator saying how long have elapsed, and what stage are we in right now, so that we make sure only up to date info is displayed. And not when workflow is running. 

7. Similarly for the Evidence board, it's good we are using prefix of [e num] structure, but it's better if it can be separated automatically, like with buyer submitted info prefix of b, seller of s, and review with r, logistics with l, so once can know who's audience have done  easily

8. The Evience board similarly shouldn't just be amtrix board format, but having a timeline with LHS been inputted by the buyer, and center been the natural party inputted/generated(reviewer/logistics trail)  and RHS been the seller, so we can easily see the parties. Similarly we should give context, such as the buyer seller rating, last 30 day return count and percentage on the top of RHS and LHS, with the center been the typical return policies like what we have got "Wrong item or wrong SKU cases are eligible for full refund or exchange when buyer evidence shows a mismatch against the order record. Seller packing evidence may rebut the claim only if labels, SKU, and timestamps are consistent."

9. Uncontested shouldn't say "Decision

   Escalate to human review

   Manual reviewer to confirm refund path", Just say seller eligible for return and refund by consent or 7 day policy determine by which clause it fall under

User 2:

Core Proposal
Make the reviewer’s first screen answer five questions immediately:

What case am I reviewing?
What verdict is currently recommended?
Why was that verdict reached?
Where do the AI/jury members disagree?
What action should I take next?
Recommended Dashboard Structure
Use a reviewer-first layout:

Left: Review Queue

Priority, risk level, SLA/time waiting, assigned reviewer
Filters for High disagreement, Needs escalation, Policy risk, Low confidence, New evidence
Avoid vanity metrics here; reviewers need next-case clarity.
Center: Case + Verdict Workspace

Current recommended verdict
Required human action: Approve, Reject, Escalate, Request more evidence
Confidence level and risk severity
Short “decision brief” summarizing the case in human language
Submit area with required rationale before final decision
Right: Deliberation + Jury Panel

Each jury member/agent/persona shows:
Vote/verdict
Confidence
Main rationale
Evidence used
Disagreement notes
Highlight split decisions clearly, e.g. 3 approve / 2 reject / 1 escalate
Let reviewer drill into one juror’s reasoning without leaving the case.
Most Important UX Additions
The biggest improvement would be a Deliberation Timeline: show how the system moved from evidence → arguments → disagreement → final recommendation. Human reviewers need traceability more than they need charts.

Add a Disagreement Inspector that groups conflicts by type:

Factual disagreement
Policy interpretation disagreement
Evidence quality disagreement
Confidence/risk disagreement
Missing information
Add a Reviewer Verdict Composer with structured fields:

Final verdict
Reason
Evidence relied on
Override reason, if human disagrees with system
Escalation target, if needed
What I Would Avoid
Avoid making the main page a KPI/admin dashboard. Metrics like total cases, completion rate, average score, etc. can exist, but they should be secondary. For human review, the interface should feel like a decision room, not a BI dashboard.

Also avoid hiding raw evidence behind too many clicks. A reviewer must be able to quickly inspect the source material that caused the recommendation.

Nice Next-Level Ideas
Add “similar past cases” so reviewers can compare consistency.

Add a “why this is risky” panel for high-impact decisions.

Add reviewer calibration: after final decision, show whether their verdict aligned with later outcomes.

Add escalation workflow with notes and handoff history.

My strongest recommendation: build the alternative dashboard as the primary reviewer experience, then keep analytics/admin views separate. The reviewer UI should be organized around judgment, evidence, disagreement, and accountability.

possible buyer/seller/logistics split panel. 

NEED to prepare some test cases that can confirm can work out.

DO WE NEED A shopee like design? 

NEED REAL DB NOT MOCK? CAN use supabase for mocking or what.

agent interaction framework