import { NextResponse } from "next/server";
import { executeTask } from "../../../../executorAgent";

export async function POST(request: Request) {
  const { task, model = "openai", ragEnabled = true } = await request.json();
  const result = await executeTask(task, 5, model, ragEnabled);
  return NextResponse.json(result);
}
