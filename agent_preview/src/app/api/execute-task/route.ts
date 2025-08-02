import { NextResponse } from "next/server";
import { executeTask } from "./executorAgent";

export async function POST(request: Request) {
  const { task, ragEnabled = true } = await request.json();
  const result = await executeTask(task, 5, ragEnabled);
  return NextResponse.json(result);
}
