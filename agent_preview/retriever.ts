import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text: string) {
  const embedder = await pipeline("feature-extraction", "Xenova/e5-small-v2");
  const result = await embedder(text);
  const embedding = Array.isArray(result.data[0]) ? result.data[0] : Array.from(result.data);
  return embedding;
}

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
    const projectPath = path.join(process.cwd(), "example-project");
    
    // Get all project files dynamically
    const allFiles = getAllProjectFiles(projectPath);
    console.log("[retriever] Found files:", allFiles.map(f => f.file));
    
    // Simple keyword-based matching for immediate functionality
    const keywords = prompt.toLowerCase().split(/\s+/);
    const relevantFiles = allFiles.filter(file => {
      const fileName = file.file.toLowerCase();
      const fileContent = file.code.toLowerCase();
      
      // Check for specific keywords in prompt
      if (keywords.some(k => 
        k.includes('player') || k.includes('health') || k.includes('hp')
      )) {
        return fileName.includes('player') || 
               fileContent.includes('health') || 
               fileContent.includes('player') ||
               fileContent.includes('hp');
      }
      
      if (keywords.some(k => 
        k.includes('enemy') || k.includes('monster')
      )) {
        return fileName.includes('enemy') || 
               fileContent.includes('enemy') ||
               fileContent.includes('monster');
      }
      
      if (keywords.some(k => 
        k.includes('bullet') || k.includes('projectile') || k.includes('shot')
      )) {
        return fileName.includes('bullet') || 
               fileContent.includes('bullet') ||
               fileContent.includes('projectile');
      }
      
      if (keywords.some(k => 
        k.includes('scene') || k.includes('main') || k.includes('game')
      )) {
        return fileName.includes('scene') || 
               fileName.includes('main') ||
               fileContent.includes('scene');
      }
      
      // Default fallback - check if any keywords match file content
      return keywords.some(keyword => 
        fileName.includes(keyword) || fileContent.includes(keyword)
      );
    });
    
    console.log("[retriever] Relevant files after filtering:", relevantFiles.map(f => f.file));
    
    // If we found specific matches, return them
    if (relevantFiles.length > 0) {
      return relevantFiles.slice(0, topK);
    }
    
    // Fallback: return main game files if no specific matches
    const fallbackFiles = allFiles.filter(file => {
      const fileName = file.file.toLowerCase();
      return fileName.includes('main') || 
             fileName.includes('player') || 
             fileName.includes('game') ||
             fileName.includes('scene');
    });
    
    console.log("[retriever] Using fallback files:", fallbackFiles.map(f => f.file));
    
    return fallbackFiles.slice(0, topK).length > 0 ? 
           fallbackFiles.slice(0, topK) : 
           allFiles.slice(0, Math.min(topK, allFiles.length));
           
  } catch (error) {
    console.error("[retriever] Error:", error);
    
    // Emergency fallback: try to find any TypeScript/JavaScript files
    try {
      const projectPath = path.join(process.cwd(), "example-project");
      const files = fs.readdirSync(projectPath)
        .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
        .map(f => ({
          file: f,
          code: fs.readFileSync(path.join(projectPath, f), 'utf-8'),
          type: 'fallback'
        }));
      
      return files.slice(0, topK);
    } catch (fallbackError) {
      console.error("[retriever] Fallback error:", fallbackError);
      return [];
    }
  }
}
