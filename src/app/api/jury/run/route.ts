import { NextResponse } from "next/server";
import { runReturnWorkflow } from "@/lib/jury/workflow";
import { juryCaseInputSchema } from "@/types/jury";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caseInput = juryCaseInputSchema.parse(body);
    const workflowResult = await runReturnWorkflow(caseInput);
    return NextResponse.json(workflowResult);
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
