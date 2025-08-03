import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const metadataPath = path.join(process.cwd(), "example-project", "import_metadata.json");
    
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({ isImported: false });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Check if import is recent (within last hour)
    const importTime = new Date(metadata.importedAt);
    const now = new Date();
    const hoursSinceImport = (now.getTime() - importTime.getTime()) / (1000 * 60 * 60);
    
    return NextResponse.json({
      isImported: hoursSinceImport < 1, // Show banner for 1 hour
      metadata: metadata
    });
    
  } catch (error) {
    console.error("[ImportStatus] Error checking import status:", error);
    return NextResponse.json({ isImported: false });
  }
}
