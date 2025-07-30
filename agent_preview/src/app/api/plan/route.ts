import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY // or just leave it blank for now
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Break this request into a step-by-step plan. Make sure to be simple, don't overcomplicate it. Do as little steps as possible but don't over condense steps. Return ONLY a JSON array of objects, where each object has: step (number), instruction (string) and expected_outcome (string). Do NOT include any code block formatting, markdown, or extra text. Example: [{"step": 1, "description": "First step."}, ...] The request: ${prompt}`
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json([`Gemini API error: ${response.status} ${response.statusText} - ${text}`], { status: 500 });
  }

  const data = await response.json();
  let steps: any[] = [];
  try {
    // Extract the plan text from Gemini's response, even if wrapped in code block formatting
    let output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) {
      steps = ["No plan text found in Gemini response."];
    } else {
      // Remove code block markers and whitespace
      output = output.replace(/```json|```/g, "").trim();
      // Try to find the first JSON array in the string
      const match = output.match(/\[[\s\S]*?\]/);
      const jsonText = match ? match[0] : output;
      try {
        steps = JSON.parse(jsonText);
      } catch {
        steps = [jsonText]; // Fallback: return the raw text as a single step
      }
    }
  } catch (e) {
    steps = ["Could not parse plan from Gemini response."];
  }

  // Write steps to scratchpad.json in the project root
  try {
    // Add 'completed' field to each step if it's an object
    const stepsWithStatus = Array.isArray(steps)
      ? steps.map(step =>
          typeof step === 'object' && step !== null
            ? { ...step, completed: false }
            : step
        )
      : steps;
    fs.writeFileSync(path.join(process.cwd(), "scratchpad.json"), JSON.stringify(stepsWithStatus, null, 2));
  } catch (e) {
    // Optionally log or handle file write errors
  }

  return NextResponse.json(steps);
}