import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";

export interface CodeChunk {
  file: string;
  symbol: string;
  code: string;
  embedding: number[];
  lastModified: number;
}

export interface VectorSearchResult {
  file: string;
  symbol: string;
  code: string;
  similarity: number;
}

export class VectorDatabase {
  private dbPath: string;
  private chunks: CodeChunk[] = [];
  private embedder: any = null;

  constructor(dbPath: string = "data/code_chunks.json") {
    this.dbPath = path.resolve(dbPath);
    // Ensure the data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.loadDatabase();
  }

  private async initEmbedder() {
    if (!this.embedder) {
      this.embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return this.embedder;
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.chunks = JSON.parse(data);
        console.log(`[VectorDB] Loaded ${this.chunks.length} chunks from database`);
      } else {
        console.log("[VectorDB] No existing database found, starting fresh");
        this.chunks = [];
      }
    } catch (error) {
      console.error("[VectorDB] Error loading database:", error);
      this.chunks = [];
    }
  }

  private saveDatabase() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.chunks, null, 2));
      console.log(`[VectorDB] Saved ${this.chunks.length} chunks to database`);
    } catch (error) {
      console.error("[VectorDB] Error saving database:", error);
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const embedder = await this.initEmbedder();
    const result = await embedder(text);
    return Array.isArray(result.data[0]) ? result.data[0] : Array.from(result.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async addChunk(file: string, symbol: string, code: string, lastModified: number = Date.now()): Promise<void> {
    const embedding = await this.getEmbedding(code);
    
    // Remove existing chunk for the same file/symbol
    this.chunks = this.chunks.filter(chunk => 
      !(chunk.file === file && chunk.symbol === symbol)
    );
    
    // Add new chunk
    this.chunks.push({
      file,
      symbol,
      code,
      embedding,
      lastModified
    });
  }

  async addChunks(chunks: Array<{file: string, symbol: string, code: string}>): Promise<void> {
    console.log(`[VectorDB] Adding ${chunks.length} chunks...`);
    const timestamp = Date.now();
    
    for (const chunk of chunks) {
      await this.addChunk(chunk.file, chunk.symbol, chunk.code, timestamp);
    }
    
    this.saveDatabase();
  }

  removeFile(filePath: string): void {
    const initialLength = this.chunks.length;
    this.chunks = this.chunks.filter(chunk => chunk.file !== filePath);
    if (this.chunks.length !== initialLength) {
      console.log(`[VectorDB] Removed ${initialLength - this.chunks.length} chunks for file: ${filePath}`);
      this.saveDatabase();
    }
  }

  async updateFile(filePath: string, symbols: Array<{symbol: string, code: string}>): Promise<void> {
    console.log(`[VectorDB] Updating file: ${filePath}`);
    
    // Remove existing chunks for this file
    this.removeFile(filePath);
    
    // Add new chunks
    const timestamp = Date.now();
    for (const symbolData of symbols) {
      await this.addChunk(filePath, symbolData.symbol, symbolData.code, timestamp);
    }
    
    this.saveDatabase();
  }

  async search(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    if (this.chunks.length === 0) {
      console.log("[VectorDB] No chunks in database");
      return [];
    }

    const queryEmbedding = await this.getEmbedding(query);
    
    // Calculate similarities
    const results = this.chunks.map(chunk => ({
      file: chunk.file,
      symbol: chunk.symbol,
      code: chunk.code,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  getStats() {
    const fileCount = new Set(this.chunks.map(c => c.file)).size;
    return {
      totalChunks: this.chunks.length,
      uniqueFiles: fileCount,
      dbPath: this.dbPath
    };
  }

  clear(): void {
    this.chunks = [];
    this.saveDatabase();
  }
}

// Singleton instance
let vectorDbInstance: VectorDatabase | null = null;

export function getVectorDatabase(): VectorDatabase {
  if (!vectorDbInstance) {
    vectorDbInstance = new VectorDatabase();
  }
  return vectorDbInstance;
}
