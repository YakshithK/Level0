import { NextRequest, NextResponse } from "next/server";
import { IndexingService } from "../indexing-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const indexingService = IndexingService.getInstance();

    switch (action) {
      case 'status':
        const status = indexingService.getStatus();
        return NextResponse.json(status);

      case 'reindex':
        await indexingService.reindexAll();
        const newStatus = indexingService.getStatus();
        return NextResponse.json({ 
          message: "Re-indexing completed",
          status: newStatus 
        });

      case 'initialize':
        await indexingService.initialize();
        const initStatus = indexingService.getStatus();
        return NextResponse.json({ 
          message: "Initialization completed",
          status: initStatus 
        });

      default:
        const defaultStatus = indexingService.getStatus();
        return NextResponse.json(defaultStatus);
    }
  } catch (error) {
    console.error("[Indexing API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const indexingService = IndexingService.getInstance();

    switch (action) {
      case 'reindex':
        await indexingService.reindexAll();
        const status = indexingService.getStatus();
        return NextResponse.json({ 
          message: "Re-indexing completed",
          status 
        });

      case 'initialize':
        await indexingService.initialize();
        const initStatus = indexingService.getStatus();
        return NextResponse.json({ 
          message: "Initialization completed",
          status: initStatus 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Indexing API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
