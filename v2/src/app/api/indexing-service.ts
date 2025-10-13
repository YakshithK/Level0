import { getVectorDatabase } from "./vector-db";
import { getFileWatcher } from "./file-watcher";
import { indexAllFiles } from "./code-indexer";
import path from "path";

export class IndexingService {
  private static instance: IndexingService | null = null;
  private isInitialized = false;
  private projectPath: string;

  constructor(projectPath: string = "example-project") {
    this.projectPath = path.resolve(projectPath);
  }

  static getInstance(projectPath?: string): IndexingService {
    if (!IndexingService.instance) {
      IndexingService.instance = new IndexingService(projectPath);
    }
    return IndexingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("[IndexingService] Already initialized");
      return;
    }

    console.log("[IndexingService] Starting initialization...");

    try {
      const vectorDb = getVectorDatabase();
      const stats = vectorDb.getStats();
      
      console.log(`[IndexingService] Current database stats:`, stats);

      // Check if we need to do initial indexing
      if (stats.totalChunks === 0) {
        console.log("[IndexingService] Database is empty, performing initial indexing...");
        await indexAllFiles(this.projectPath);
      } else {
        console.log("[IndexingService] Database already contains data, skipping initial indexing");
      }

      // Start file watcher for live updates
      const fileWatcher = getFileWatcher();
      if (!fileWatcher.isActive()) {
        fileWatcher.start();
        console.log("[IndexingService] File watcher started");
      }

      this.isInitialized = true;
      console.log("[IndexingService] Initialization complete");

    } catch (error) {
      console.error("[IndexingService] Initialization failed:", error);
      throw error;
    }
  }

  async reindexAll(): Promise<void> {
    console.log("[IndexingService] Starting full re-indexing...");
    
    try {
      const vectorDb = getVectorDatabase();
      vectorDb.clear();
      
      await indexAllFiles(this.projectPath);
      
      const stats = vectorDb.getStats();
      console.log("[IndexingService] Re-indexing complete:", stats);
    } catch (error) {
      console.error("[IndexingService] Re-indexing failed:", error);
      throw error;
    }
  }

  getStatus() {
    const vectorDb = getVectorDatabase();
    const fileWatcher = getFileWatcher();
    
    return {
      initialized: this.isInitialized,
      projectPath: this.projectPath,
      vectorDbStats: vectorDb.getStats(),
      fileWatcherActive: fileWatcher.isActive(),
      watchedPaths: fileWatcher.getWatchedPaths()
    };
  }

  shutdown(): void {
    console.log("[IndexingService] Shutting down...");
    
    const fileWatcher = getFileWatcher();
    fileWatcher.stop();
    
    this.isInitialized = false;
    console.log("[IndexingService] Shutdown complete");
  }
}

// Auto-initialize in development mode
let autoInitialized = false;

export async function ensureInitialized(): Promise<void> {
  if (!autoInitialized) {
    const service = IndexingService.getInstance();
    await service.initialize();
    autoInitialized = true;
  }
}

// Auto-initialization on module load in development
if (process.env.NODE_ENV === 'development' && !autoInitialized) {
  ensureInitialized().catch(error => {
    console.error("[IndexingService] Auto-initialization failed:", error);
  });
}
