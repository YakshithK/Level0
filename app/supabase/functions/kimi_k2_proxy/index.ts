// Supabase Edge Function: Kimi K2 Proxy
// POST { messages: [...], systemPrompt?: string }
// Returns: { thinking, code, fullText }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MOONSHOT_API_KEY = Deno.env.get("MOONSHOT_API_KEY");
const MOONSHOT_API_URL = "https://api.moonshot.ai/v1/chat/completions";
const MODEL = "moonshot-v1-128k";

function stripCodeBlock(code: string): string {
  return code
    .replace(/^\s*```(?:javascript)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!MOONSHOT_API_KEY) {
    return new Response("Moonshot API key not set", { status: 500, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const { messages, systemPrompt } = body;
  if (!Array.isArray(messages)) {
    return new Response("Missing or invalid 'messages' array", { status: 400, headers: corsHeaders });
  }

  // Prepend system prompt if provided
  const chatMessages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...messages
  ];

  const payload = {
    model: MODEL,
    messages: chatMessages,
    max_tokens: 4000,
    temperature: 0.6
  };

  const moonshotRes = await fetch(MOONSHOT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MOONSHOT_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!moonshotRes.ok) {
    const errText = await moonshotRes.text();
    return new Response(`Moonshot API error: ${errText}`, { status: 500, headers: corsHeaders });
  }

  const data = await moonshotRes.json();
  const fullText = data.choices?.[0]?.message?.content || "";
  let thinking = "";
  let code = "";
  const thinkingMatch = fullText.match(/<Thinking>([\s\S]*?)<\/Thinking>/i);
  if (thinkingMatch) {
    thinking = thinkingMatch[1].trim();
  }
  const codeMatch = fullText.match(/```javascript([\s\S]*?)```/i) || fullText.match(/```([\s\S]*?)```/i);
  if (codeMatch) {
    code = codeMatch[1].trim();
  } else {
    code = stripCodeBlock(fullText);
  }

  return new Response(
    JSON.stringify({ thinking, code, fullText }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}); 