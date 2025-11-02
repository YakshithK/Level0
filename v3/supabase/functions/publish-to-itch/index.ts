import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, username, gameId, gameFiles } = await req.json();
    
    console.log("Publishing to itch.io:", { username, gameId });

    // Check if the game exists
    const gameUrl = `https://itch.io/api/1/${apiKey}/game/${gameId}`;
    const gameCheckResponse = await fetch(gameUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!gameCheckResponse.ok) {
      throw new Error(`Game not found. Make sure the game ID is correct.`);
    }

    // Create a ZIP file from game files
    await createZipFromFiles(gameFiles);
    
    // For now, we return instructions since Butler CLI is required for actual uploads
    // Butler is itch.io's command-line tool for uploading builds
    // Reference: https://itch.io/docs/butler/
    
    const instructions = `
Game validated successfully!

To upload your game files to itch.io, you'll need to use Butler (itch.io's upload tool).

1. Download Butler: https://itch.io/docs/butler/installing.html
2. Login: butler login
3. Upload your game:
   butler push your-game-folder ${username}/${gameId}:html

Your game page: https://${username}.itch.io/${gameId}

Note: Direct API uploads are not supported by itch.io. Butler is the official upload method.
    `.trim();

    console.log("Game check successful, returning instructions");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Game validated",
        instructions,
        gameUrl: `https://${username}.itch.io/${gameId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in publish-to-itch:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to create ZIP from files
async function createZipFromFiles(files: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip();
  
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }
  
  return await zip.generateAsync({ type: "uint8array" });
}
