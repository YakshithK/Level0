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
  // Use a more code-friendly embedding model
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
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
    
    // Use embedding-based semantic search with simple, effective approach
    const promptEmbedding = await getEmbedding(prompt);
    
    // Calculate similarity scores for each file
    const fileScores = await Promise.all(
      allFiles.map(async (file) => {
        // Simple approach: combine filename and code naturally
        const searchText = `${file.file} ${file.code}`;
        const fileEmbedding = await getEmbedding(searchText);
        let similarity = cosineSimilarity(promptEmbedding, fileEmbedding);
        
        // Add moderate filename boost for relevant matches
        const fileName = file.file.toLowerCase();
        const promptLower = prompt.toLowerCase();
        const fileNameBoost = fileName.includes(promptLower.split(' ').find(word => 
          fileName.includes(word) && word.length > 3
        ) || '') ? 0.2 : 0;
        similarity += fileNameBoost;
        
        return {
          ...file,
          similarity
        };
      })
    );
    
    // Sort by similarity score (highest first)
    const sortedFiles = fileScores.sort((a, b) => b.similarity - a.similarity);
  
    
    // Return top K most similar files
    const relevantFiles = sortedFiles.slice(0, topK);
    
    return relevantFiles;
           
  } catch (error) {
    console.error("[retriever] Error:", error);
    
    // Fallback to keyword-based matching if embedding fails
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
      
      console.log("[retriever] Using keyword fallback:", relevantFiles.map(f => f.file));
      
      return relevantFiles.slice(0, topK).length > 0 ? 
             relevantFiles.slice(0, topK) : 
             allFiles.slice(0, Math.min(topK, allFiles.length));
             
    } catch (fallbackError) {
      console.error("[retriever] Fallback error:", fallbackError);
      
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
        console.error("[retriever] Emergency fallback error:", emergencyError);
        return [];
      }
    }
  }
}
