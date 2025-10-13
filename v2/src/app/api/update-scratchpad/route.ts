import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { taskId, status, result } = await request.json();
    
    const scratchpadPath = path.join(process.cwd(), "data", "scratchpad.json");
    let scratchpad: any = { tasks: [], completedTasks: [], errors: [] };
    
    // Read existing scratchpad
    if (fs.existsSync(scratchpadPath)) {
      try {
        const existing = fs.readFileSync(scratchpadPath, "utf8").trim();
        if (existing) {
          scratchpad = JSON.parse(existing);
        }
      } catch (error) {
        console.error("[update-scratchpad] Error parsing scratchpad.json:", error);
        console.log("[update-scratchpad] Using default scratchpad structure");
      }
    }
    
    // Update task status
    const timestamp = new Date().toISOString();
    const taskUpdate = {
      id: taskId,
      status: status, // 'completed', 'failed', 'skipped'
      result: result,
      timestamp: timestamp
    };
    
    if (status === 'completed') {
      scratchpad.completedTasks = scratchpad.completedTasks || [];
      scratchpad.completedTasks.push(taskUpdate);
    } else if (status === 'failed') {
      scratchpad.errors = scratchpad.errors || [];
      scratchpad.errors.push(taskUpdate);
    }
    
    // Write updated scratchpad
    fs.writeFileSync(scratchpadPath, JSON.stringify(scratchpad, null, 2));
    
    return NextResponse.json({ success: true, scratchpad });
  } catch (error) {
    console.error("Error updating scratchpad:", error);
    return NextResponse.json({ error: "Failed to update scratchpad" }, { status: 500 });
  }
}
