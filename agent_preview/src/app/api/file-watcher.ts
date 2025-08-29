import fs from "fs";
import path from "path";
import { getVectorDatabase } from "./vector-db";
import { extractSymbolsFromFile } from "./code-indexer";

export class FileWatcherService {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private vectorDb = getVectorDatabase();
  private projectPath: string;
  private isWatching = false;
  private recentlyModified: Set<string> = new Set(); // Track our own modifications
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map(); // Debounce timers

  constructor(projectPath: string = "example-project") {
    this.projectPath = path.resolve(projectPath);
  }

  private async handleFileChange(filePath: string, eventType: string) {
    try {
      // Normalize and validate the file path
      const normalizedPath = path.resolve(filePath);
      
      // Ignore malformed paths or paths with invalid characters
      if (normalizedPath.includes('?') || !path.isAbsolute(normalizedPath)) {
        console.log(`[FileWatcher] Ignoring malformed path: ${filePath}`);
        return;
      }
      
      // Ignore if we recently modified this file ourselves
      if (this.recentlyModified.has(normalizedPath)) {
        console.log(`[FileWatcher] Ignoring self-induced change: ${normalizedPath}`);
        return;
      }
      
      // Only process files within our project directory
      if (!normalizedPath.startsWith(this.projectPath)) {
        return;
      }
      
      console.log(`[FileWatcher] File ${eventType}: ${normalizedPath}`);
      
      const relativePath = path.relative(process.cwd(), normalizedPath).replace(/\\/g, '/');
      
      // Mark this file as recently modified by us to prevent loops
      this.recentlyModified.add(normalizedPath);
      setTimeout(() => {
        this.recentlyModified.delete(normalizedPath);
      }, 2000); // Clear after 2 seconds
      
      if (eventType === 'rename' || !fs.existsSync(normalizedPath)) {
        // File deleted or renamed
        this.vectorDb.removeFile(relativePath);
        return;
      }

      // File modified or created
      if (this.isCodeFile(normalizedPath)) {
        const symbols = extractSymbolsFromFile(normalizedPath);
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
          // Clear any existing debounce timer for this file
          const existingTimer = this.debounceTimers.get(filename);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }
          
          // Set new debounce timer
          const timer = setTimeout(() => {
            try {
              const fullPath = path.resolve(dirPath, filename);
              this.handleFileChange(fullPath, eventType);
            } catch (error) {
              console.error(`[FileWatcher] Error processing file change:`, error);
            }
            this.debounceTimers.delete(filename);
          }, 300); // Increased debounce to 300ms
          
          this.debounceTimers.set(filename, timer);
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
    
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    
    // Clear recently modified tracking
    this.recentlyModified.clear();
    
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
