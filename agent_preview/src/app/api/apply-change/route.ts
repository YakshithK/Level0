import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const { file, content } = await request.json();
  const absPath = path.join(process.cwd(), file);
  fs.writeFileSync(absPath, content, "utf8");
  // Optionally remove the entry from pending_changes.json
  const pendingPath = path.join(process.cwd(), "pending_changes.json");
  if (fs.existsSync(pendingPath)) {
    const pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
    delete pending[file];
    fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
  }
  return NextResponse.json({ success: true });
}
