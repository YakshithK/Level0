import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path;
    
    // Skip processing if this looks like an external URL
    if (filePath.some(segment => segment.includes('http') || segment.includes('cdn') || segment.includes('.com'))) {
      return new NextResponse("External URL not supported", { status: 404 });
    }
    
    const projectPath = path.join(process.cwd(), "example-project");
    const fullFilePath = path.join(projectPath, ...filePath);
    
    // Security check - ensure the file is within the project directory
    const resolvedPath = path.resolve(fullFilePath);
    const resolvedProjectPath = path.resolve(projectPath);
    
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return new NextResponse("Access denied", { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileExt = path.extname(resolvedPath).toLowerCase();
    
    // Handle image files
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(fileExt)) {
      const imageBuffer = fs.readFileSync(resolvedPath);
      
      let contentType = 'image/png';
      if (fileExt === '.jpg' || fileExt === '.jpeg') contentType = 'image/jpeg';
      else if (fileExt === '.gif') contentType = 'image/gif';
      else if (fileExt === '.svg') contentType = 'image/svg+xml';
      else if (fileExt === '.webp') contentType = 'image/webp';
      else if (fileExt === '.ico') contentType = 'image/x-icon';
      
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Read the file as text for other file types
    let content = fs.readFileSync(resolvedPath, "utf-8");
    
    // If it's a TypeScript file, do basic conversion to JavaScript
    if (fileExt === '.ts') {
      content = content
        .replace(/:\s*\w+(\[\])?(\s*=|\s*\{|\s*\(|\s*;|\s*,|\s*\))/g, '$1') // Remove type annotations
        .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interface declarations
        .replace(/export\s+/g, '') // Remove export keywords for browser compatibility
        .replace(/import.*from.*['"];?\n?/g, ''); // Remove import statements
    }

    // Determine content type
    let contentType = 'text/plain';
    if (fileExt === '.js' || fileExt === '.ts') {
      contentType = 'application/javascript';
    } else if (fileExt === '.json') {
      contentType = 'application/json';
    } else if (fileExt === '.html') {
      contentType = 'text/html';
    } else if (fileExt === '.css') {
      contentType = 'text/css';
    }
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
