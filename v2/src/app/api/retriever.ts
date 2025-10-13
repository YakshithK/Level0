import fs from "fs";
import path from "path";
import { getVectorDatabase } from "./vector-db";
import { ensureInitialized } from "./indexing-service";

// Get all files from the project directory recursively
function getAllProjectFiles(dir: string, baseDir: string = dir): any[] {
  const files: any[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllProjectFiles(fullPath, baseDir));
    } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.tsx')) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Create chunks for the file
      files.push({
        file: relativePath,
        code: content,
        type: 'full_file'
      });
    }
  }
  
  return files;
}

export async function retrieveRelevantChunks(prompt: string, topK = 5) {
  try {
    // Ensure indexing system is initialized
    await ensureInitialized();
    
    const vectorDb = getVectorDatabase();
    
    // Search using vector database
    const results = await vectorDb.search(prompt, topK);
    
    console.log(`[Retriever] Found ${results.length} relevant chunks with similarities:`, 
      results.map(r => `${r.similarity.toFixed(3)}`).join(", "));
    
    // Convert to expected format
    return results.map(result => ({
      file: result.file,
      code: result.code,
      type: 'vector_search',
      similarity: result.similarity
    }));
           
  } catch (error) {
    console.error("[Retriever] Error:", error);
    
    // Fallback to keyword-based matching if vector search fails
    try {
      const projectPath = path.join(process.cwd(), "example-project");
      const allFiles = getAllProjectFiles(projectPath);
      
      // Simple keyword fallback
      const keywords = prompt.toLowerCase().split(/\s+/);
      const relevantFiles = allFiles.filter(file => {
        const fileName = file.file.toLowerCase();
        const fileContent = file.code.toLowerCase();
        
        return keywords.some(keyword => 
          fileName.includes(keyword) || fileContent.includes(keyword)
        );
      });
      
      console.log("[Retriever] Using keyword fallback:", relevantFiles.map(f => f.file));
      
      return relevantFiles.slice(0, topK).length > 0 ? 
             relevantFiles.slice(0, topK) : 
             allFiles.slice(0, Math.min(topK, allFiles.length));
             
    } catch (fallbackError) {
      console.error("[Retriever] Fallback error:", fallbackError);
      
      // Emergency fallback: return any available files
      try {
        const projectPath = path.join(process.cwd(), "example-project");
        const files = fs.readdirSync(projectPath)
          .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
          .map(f => ({
            file: f,
            code: fs.readFileSync(path.join(projectPath, f), 'utf-8'),
            type: 'emergency_fallback'
          }));
        
        return files.slice(0, topK);
      } catch (emergencyError) {
        console.error("[Retriever] Emergency fallback error:", emergencyError);
        return [];
      }
    }
  }
}
