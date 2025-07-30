import { NextResponse } from "next/server";
import { executeTask } from "../../../../executorAgent";

export async function POST(request: Request) {
  const { task } = await request.json();
  const result = await executeTask(task);
  return NextResponse.json(result);
}
