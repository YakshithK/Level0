import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { file, content } = await request.json();
    
    // Ensure the file path is correctly resolved to the example-project directory
    let filePath = file;
    
    // If the file path doesn't start with example-project, add it
    if (!filePath.startsWith('example-project')) {
      filePath = path.join('example-project', filePath);
    }
    
    const absPath = path.join(process.cwd(), filePath);
    
    // Ensure the directory exists before writing
    const dirPath = path.dirname(absPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(absPath, content, "utf8");
    console.log("[apply-change] Successfully wrote file:", absPath);
    
    // Optionally remove the entry from pending_changes.json
    const pendingPath = path.join(process.cwd(), "pending_changes.json");
    if (fs.existsSync(pendingPath)) {
      const pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
      delete pending[file];
      fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
    }
    
    return NextResponse.json({ success: true, filePath: absPath });
  } catch (error) {
    console.error("[apply-change] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
