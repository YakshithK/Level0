import { IndexingService } from "./api/indexing-service";

// This module handles startup initialization for the indexing system
export async function initializeApp() {
  try {
    console.log("[App Startup] Initializing indexing system...");
    
    const indexingService = IndexingService.getInstance();
    await indexingService.initialize();
    
    console.log("[App Startup] Indexing system initialized successfully");
    
    // Return status for verification
    return indexingService.getStatus();
    
  } catch (error) {
    console.error("[App Startup] Failed to initialize indexing system:", error);
    throw error;
  }
}

// Optional: Auto-initialize in development mode
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Only run on server-side in development
  initializeApp().catch(error => {
    console.error("[App Startup] Auto-initialization failed:", error);
  });
}
