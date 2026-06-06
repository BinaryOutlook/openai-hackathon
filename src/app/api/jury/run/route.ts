import { NextResponse } from "next/server";
import { runMockJury } from "@/lib/jury/mock";
import { runLiveJury } from "@/lib/jury/openai";
import { juryCaseInputSchema } from "@/types/jury";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caseInput = juryCaseInputSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(runMockJury(caseInput));
    }

    try {
      const result = await runLiveJury(caseInput);
      return NextResponse.json(result);
    } catch (error) {
      const fallback = runMockJury(caseInput);
      return NextResponse.json({
        ...fallback,
        deliberation: `${fallback.deliberation} Live model execution failed, so the deterministic demo jury was used for continuity.`
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid jury case input",
        details: error instanceof Error ? error.message : "Unknown validation error"
      },
      { status: 400 }
    );
  }
}
