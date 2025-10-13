import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameFiles {
  [key: string]: string;
}

interface PublishRequest {
  apiKey: string;
  username: string;
  gameId: string;
  gameFiles: GameFiles;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, username, gameId, gameFiles }: PublishRequest = await req.json();

    console.log(`Publishing game for user: ${username}, game ID: ${gameId}`);

    // Validate inputs
    if (!apiKey || !username || !gameId || !gameFiles) {
      throw new Error("Missing required fields");
    }

    // Demo/placeholder response for now
    // The actual API integration will be implemented later
    console.log("Game files received:", Object.keys(gameFiles));
    console.log("API Key (first 4 chars):", apiKey.substring(0, 4) + "...");
    
    // Simulate success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Game files processed successfully (demo mode)",
        gameId: gameId,
        gameUrl: `https://${username}.itch.io/game-${gameId}`,
        editUrl: `https://itch.io/dashboard/game/${gameId}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error publishing to Itch.io:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createZipFromFiles(files: GameFiles): Promise<Uint8Array> {
  // Simple implementation - in production, you'd use a proper zip library
  // For now, we'll just combine the files
  const encoder = new TextEncoder();
  const fileContents: Uint8Array[] = [];
  
  for (const [filename, content] of Object.entries(files)) {
    fileContents.push(encoder.encode(`\n\n=== ${filename} ===\n\n${content}`));
  }
  
  // Concatenate all file contents
  const totalLength = fileContents.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const arr of fileContents) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}
