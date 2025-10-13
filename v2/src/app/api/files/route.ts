import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to recursively get all files and directories
function getAllFilesRecursively(dirPath: string, relativePath: string = ""): any[] {
  const items: any[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const itemPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Add directory entry
        items.push({
          name: entry.name,
          path: itemPath,
          type: "directory",
        });
        
        // Recursively get files from subdirectory
        const subItems = getAllFilesRecursively(fullPath, itemPath);
        items.push(...subItems);
      } else if (entry.isFile()) {
        // Add file entry
        items.push({
          name: entry.name,
          path: itemPath,
          type: "file",
        });
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dirPath}:`, e);
  }
  
  return items;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileParam = searchParams.get("file");
  
  if (fileParam) {
    // Read and return the file content
    const absPath = path.join(process.cwd(), fileParam);
    try {
      const content = fs.readFileSync(absPath, "utf8");
      return NextResponse.json({ content });
    } catch (e) {
      return NextResponse.json({ content: "", error: "File not found or cannot be read." }, { status: 404 });
    }
  } else {
    // List all files and directories recursively in example-project
    const dirPath = path.join(process.cwd(), "example-project");
    try {
      const items = getAllFilesRecursively(dirPath, "example-project");
      return NextResponse.json(items);
    } catch (e) {
      return NextResponse.json({ error: "Directory not found." }, { status: 404 });
    }
  }
}