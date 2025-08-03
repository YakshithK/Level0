import fs from "fs";
import path from "path";
import { getVectorDatabase } from "./vector-db";
import { extractSymbolsFromFile } from "./code-indexer";

export class FileWatcherService {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private vectorDb = getVectorDatabase();
  private projectPath: string;
  private isWatching = false;

  constructor(projectPath: string = "example-project") {
    this.projectPath = path.resolve(projectPath);
  }

  private async handleFileChange(filePath: string, eventType: string) {
    try {
      console.log(`[FileWatcher] File ${eventType}: ${filePath}`);
      
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      
      if (eventType === 'rename' || !fs.existsSync(filePath)) {
        // File deleted or renamed
        this.vectorDb.removeFile(relativePath);
        return;
      }

      // File modified or created
      if (this.isCodeFile(filePath)) {
        const symbols = extractSymbolsFromFile(filePath);
        await this.vectorDb.updateFile(relativePath, symbols);
      }
    } catch (error) {
      console.error(`[FileWatcher] Error handling file change for ${filePath}:`, error);
    }
  }

  private isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
  }

  private watchDirectory(dirPath: string) {
    if (this.watchers.has(dirPath)) {
      return; // Already watching
    }

    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          const fullPath = path.join(dirPath, filename);
          
          // Debounce rapid changes
          setTimeout(() => {
            this.handleFileChange(fullPath, eventType);
          }, 100);
        }
      });

      this.watchers.set(dirPath, watcher);
      console.log(`[FileWatcher] Started watching: ${dirPath}`);
    } catch (error) {
      console.error(`[FileWatcher] Error watching directory ${dirPath}:`, error);
    }
  }

  start() {
    if (this.isWatching) {
      console.log("[FileWatcher] Already watching");
      return;
    }

    if (!fs.existsSync(this.projectPath)) {
      console.error(`[FileWatcher] Project path does not exist: ${this.projectPath}`);
      return;
    }

    this.isWatching = true;
    this.watchDirectory(this.projectPath);
    
    console.log(`[FileWatcher] Started watching project: ${this.projectPath}`);
  }

  stop() {
    console.log("[FileWatcher] Stopping file watcher...");
    
    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        console.log(`[FileWatcher] Stopped watching: ${path}`);
      } catch (error) {
        console.error(`[FileWatcher] Error closing watcher for ${path}:`, error);
      }
    }
    
    this.watchers.clear();
    this.isWatching = false;
  }

  isActive(): boolean {
    return this.isWatching;
  }

  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }
}

// Singleton instance
let fileWatcherInstance: FileWatcherService | null = null;

export function getFileWatcher(): FileWatcherService {
  if (!fileWatcherInstance) {
    fileWatcherInstance = new FileWatcherService();
  }
  return fileWatcherInstance;
}

// Auto-start watcher in development mode
if (process.env.NODE_ENV === 'development') {
  const watcher = getFileWatcher();
  watcher.start();
  
  // Cleanup on process exit
  process.on('SIGINT', () => {
    watcher.stop();
    process.exit();
  });
  
  process.on('SIGTERM', () => {
    watcher.stop();
    process.exit();
  });
}
