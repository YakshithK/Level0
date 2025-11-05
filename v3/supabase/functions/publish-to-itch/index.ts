// supabase/functions/publish-to-itch/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const BUTLER_SERVICE_URL = "https://level0-production.up.railway.app";
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { api_key, username, game_slug, channel, zip_url } = await req.json();
    if (!api_key || !username || !game_slug || !zip_url) {
      return new Response(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log('Calling butler service with:', {
      username,
      game_slug,
      channel
    });
    // Call butler service via HTTP
    const response = await fetch(`${BUTLER_SERVICE_URL}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key,
        username,
        game_slug,
        channel: channel || "html5",
        zip_url
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Butler service error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Butler service error: ${errorText}`
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Read the NDJSON streaming response
    const text = await response.text();
    const lines = text.trim().split('\n').filter((line)=>line.trim());
    const messages = [];
    let finalSuccess = false;
    for (const line of lines){
      try {
        const parsed = JSON.parse(line);
        messages.push(parsed);
        if (parsed.success === true) {
          finalSuccess = true;
        }
      } catch (e) {
        console.error('Failed to parse line:', line);
      }
    }
    console.log('Parsed messages:', messages);
    return new Response(JSON.stringify({
      success: finalSuccess,
      messages: messages,
      error: finalSuccess ? undefined : "Publish failed"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
