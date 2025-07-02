// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


const PHASER_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Phaser Game</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    html, body, #game-container { width: 100%; height: 100%; margin: 0; padding: 0; background: #181c24; }
    #game-container { display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.js"></script>
  <script>
    // --- USER CODE START ---
    {{USER_CODE}}
    // --- USER CODE END ---
    if (typeof DynamicScene !== 'undefined') {
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#181c24',
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 600 }, debug: false } },
        scene: DynamicScene,
        parent: 'game-container'
      };
      new Phaser.Game(config);
    } else {
      document.getElementById('game-container').innerHTML = '<div style=\"color:white;font-family:monospace;\">No <b>DynamicScene</b> class found in your code.</div>';
    }
  </script>
</body>
</html>
`;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { userCode } = await req.json();
    if (!userCode) {
      return new Response(JSON.stringify({ error: "No code provided" }), { status: 400, headers: corsHeaders });
    }

    // 1. Generate index.html
    const html = PHASER_TEMPLATE.replace("{{USER_CODE}}", userCode);

    // 2. Prepare Vercel API payload
    const files = [
      {
        file: "index.html",
        data: btoa(unescape(encodeURIComponent(html))),
        encoding: "base64",
      },
    ];

    const payload = {
      name: "phaser-game",
      files,
      projectSettings: { framework: null },
    };

    // 3. Call Vercel API
    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
    if (!VERCEL_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing Vercel token" }), { status: 500, headers: corsHeaders });
    }

    const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!vercelRes.ok) {
      const err = await vercelRes.text();
      return new Response(JSON.stringify({ error: "Vercel deploy failed", details: err }), { status: 500, headers: corsHeaders });
    }

    const data = await vercelRes.json();
    const deploymentId = data?.id;
    const canonicalUrl = data?.url; // e.g., "phaser-game-lemon.vercel.app"
    let aliases: string[] = [];
    let url: string | null = null;
    await sleep(5000);
    
    if (deploymentId) {
      const aliasRes = await fetch(
        `https://api.vercel.com/v2/deployments/${deploymentId}/aliases`,
        {
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (aliasRes.ok) {
        const aliasData = await aliasRes.json();
        aliases = aliasData.aliases?.map((a: any) => a.alias) || [];
        // Filter for .vercel.app domains
        const vercelAliases = aliases.filter(a => a.endsWith('.vercel.app'));
        if (vercelAliases.length > 0) {
          // Prefer the one with the fewest dashes (simplest/shortest)
          const sorted = vercelAliases.sort((a, b) => (a.match(/-/g) || []).length - (b.match(/-/g) || []).length || a.length - b.length);
          url = sorted[0].startsWith('http') ? sorted[0] : `https://${sorted[0]}`;
        }
        // Fallback to the first alias or canonicalUrl if not found
        if (!url && vercelAliases.length > 0) {
          url = vercelAliases[0].startsWith('http') ? vercelAliases[0] : `https://${vercelAliases[0]}`;
        }
      }
    }
    if (!url && canonicalUrl) {
      url = canonicalUrl.startsWith('http') ? canonicalUrl : `https://${canonicalUrl}`;
    }

    return new Response(JSON.stringify({ url, aliases }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deploy_game' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
