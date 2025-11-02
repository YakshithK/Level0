import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, errors, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Attempting to fix game errors:', errors.length, 'issues detected');

    // Build error summary for LLM
    const errorSummary = errors.map((e: any) => 
      `[${e.severity.toUpperCase()}] ${e.file}: ${e.message}${e.suggestion ? ` - Suggestion: ${e.suggestion}` : ''}`
    ).join('\n');

    const fixPrompt = `The following Phaser game code has errors that need to be fixed:

DETECTED ERRORS:
${errorSummary}

CURRENT FILES:
${Object.keys(files).join(', ')}

Your task is to fix ONLY the errors listed above with MINIMAL changes. Do NOT rewrite the entire game.

Rules:
1. Fix syntax errors (missing brackets, parentheses, etc.)
2. Fix missing Phaser imports/CDN
3. Ensure proper Phaser Scene structure
4. Keep all existing functionality intact
5. Return ONLY the files that need changes
6. Use proper JSON format

Return a JSON object with the fixed files:
{
  "filename.js": "fixed code here",
  "index.html": "fixed html if needed"
}

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations.`;

    const messages = [
      { role: 'system', content: 'You are an expert at debugging and fixing Phaser 3 game code. Fix errors with minimal changes.' },
      ...conversationHistory.slice(-4), // Include recent context
      { role: 'user', content: fixPrompt }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.3, // Lower temperature for more focused fixes
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let fixResponse = data.choices[0].message.content;

    // Clean response
    fixResponse = fixResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let fixedFiles;
    try {
      fixedFiles = JSON.parse(fixResponse);
    } catch (parseError) {
      console.error('Failed to parse fix response:', parseError);
      throw new Error('AI did not return valid JSON format for fixes');
    }

    // Merge fixed files with original files
    const updatedFiles = { ...files, ...fixedFiles };

    console.log('Successfully applied fixes to:', Object.keys(fixedFiles).join(', '));

    return new Response(JSON.stringify({ 
      files: updatedFiles,
      fixedFiles: Object.keys(fixedFiles),
      message: `Fixed ${Object.keys(fixedFiles).length} file(s)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fix-game-errors function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
