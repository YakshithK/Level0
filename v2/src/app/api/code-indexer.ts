import fs from "fs";
import path from "path";
import { Project } from "ts-morph";

export interface SymbolData {
  symbol: string;
  code: string;
}

const MAX_CHUNK_SIZE = 150;

function chunkCode(code: string, maxLines: number): string[] {
  const lines = code.split("\n");
  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join("\n"));
  }
  return chunks;
}

export function extractSymbolsFromFile(filePath: string): SymbolData[] {
  try {
    const ext = path.extname(filePath);
    
    // For now, only handle TypeScript/JavaScript files with ts-morph
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return [];
    }

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);
    const symbols: SymbolData[] = [];

    // Extract functions
    sourceFile.getFunctions().forEach((fn: any) => {
      const code = fn.getText();
      const chunks = chunkCode(code, MAX_CHUNK_SIZE);
      
      chunks.forEach((chunk, index) => {
        symbols.push({
          symbol: `${fn.getName() || "anonymous"}_${index}`,
          code: chunk,
        });
      });
    });

    // Extract classes
    sourceFile.getClasses().forEach((cls: any) => {
      const code = cls.getText();
      const chunks = chunkCode(code, MAX_CHUNK_SIZE);
      
      chunks.forEach((chunk, index) => {
        symbols.push({
          symbol: `${cls.getName() || "anonymous"}_${index}`,
          code: chunk,
        });
      });
    });

    // Extract exported variables
    sourceFile.getVariableDeclarations().forEach((v: any) => {
      if (v.isExported()) {
        const code = v.getText();
        const chunks = chunkCode(code, MAX_CHUNK_SIZE);
        
        chunks.forEach((chunk, index) => {
          symbols.push({
            symbol: `${v.getName()}_${index}`,
            code: chunk,
          });
        });
      }
    });

    // If no symbols found, add the entire file as one chunk
    if (symbols.length === 0) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = chunkCode(content, MAX_CHUNK_SIZE);
      
      chunks.forEach((chunk, index) => {
        symbols.push({
          symbol: `file_content_${index}`,
          code: chunk,
        });
      });
    }

    return symbols;
  } catch (error) {
    console.error(`[CodeIndexer] Error extracting symbols from ${filePath}:`, error);
    
    // Fallback: read file as plain text
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = chunkCode(content, MAX_CHUNK_SIZE);
      
      return chunks.map((chunk, index) => ({
        symbol: `fallback_${index}`,
        code: chunk,
      }));
    } catch (fallbackError) {
      console.error(`[CodeIndexer] Fallback failed for ${filePath}:`, fallbackError);
      return [];
    }
  }
}

export function getAllFiles(dir: string, exts: string[] = [".ts", ".tsx", ".js", ".jsx"]): string[] {
  let results: string[] = [];
  
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`[CodeIndexer] Directory does not exist: ${dir}`);
      return results;
    }

    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
          results = results.concat(getAllFiles(filePath, exts));
        }
      } else if (exts.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    });
  } catch (error) {
    console.error(`[CodeIndexer] Error reading directory ${dir}:`, error);
  }
  
  return results;
}

export async function indexAllFiles(projectPath: string): Promise<void> {
  const { getVectorDatabase } = await import("./vector-db");
  const vectorDb = getVectorDatabase();
  
  console.log(`[CodeIndexer] Starting to index all files in: ${projectPath}`);
  
  const files = getAllFiles(projectPath);
  console.log(`[CodeIndexer] Found ${files.length} files to index`);
  
  const allChunks: Array<{file: string, symbol: string, code: string}> = [];
  
  for (const file of files) {
    try {
      const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      const symbols = extractSymbolsFromFile(file);
      
      for (const symbol of symbols) {
        allChunks.push({
          file: relativePath,
          symbol: symbol.symbol,
          code: symbol.code,
        });
      }
      
      console.log(`[CodeIndexer] Processed ${file}: ${symbols.length} chunks`);
    } catch (error) {
      console.error(`[CodeIndexer] Error processing file ${file}:`, error);
    }
  }
  
  await vectorDb.addChunks(allChunks);
  
  const stats = vectorDb.getStats();
  console.log(`[CodeIndexer] Indexing complete:`, stats);
}
