import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from '@google/genai';
import { retrieveRelevantChunks } from "../retriever";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const tools = [
  {
    functionDeclarations: [
      {
        name: 'create_implementation_plan',
        description: 'Generate a structured implementation plan with numbered steps for a software development task. Each step should be actionable, specific, and include an expected outcome. The plan should be logically ordered and appropriate for the complexity of the request.',
        parameters: {
          type: Type.OBJECT,
          required: ["steps"],
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["step", "description", "expected_outcome"],
                properties: {
                  step: {
                    type: Type.NUMBER,
                  },
                  description: {
                    type: Type.STRING,
                  },
                  expected_outcome: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        },
      },
    ],
  }
];

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Log the prompt being sent to plan generation
  console.log(`\n=== PLAN API: Request Received ===`);
  console.log(`Prompt: "${prompt}"`);
  console.log(`===================================\n`);

  // Load the planner prompt template
  const plannerPromptPath = path.join(process.cwd(), "src", "app", "api", "plan", "planner_prompt.txt");
  const plannerPromptTemplate = fs.readFileSync(plannerPromptPath, "utf-8");

  // Retrieve relevant files for context
  const relevantChunks = await retrieveRelevantChunks(prompt);

  // Build enhanced prompt with file context
  const contextSection = relevantChunks.length > 0 
    ? `\n\nRELEVANT CODE CONTEXT:\n${relevantChunks.map(chunk => `**${chunk.file}:**\n${chunk.code ? chunk.code.substring(0, 800) : 'No content'}...`).join('\n\n')}`
    : "";

  const config = {
    tools,
    systemInstruction: [
      {
        text: plannerPromptTemplate,
      }
    ],
  };

  const model = 'gemini-2.0-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `USER REQUEST: "${prompt}"${contextSection}

Analyze the request and context, then provide your step-by-step implementation plan using the create_implementation_plan function.`,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let steps: any[] = [];
    let hasValidPlan = false;

    for await (const chunk of response) {
      if (chunk.functionCalls && chunk.functionCalls[0]) {
        const functionCall = chunk.functionCalls[0];
        console.log("[planner] Function call received:", functionCall.name);
        
        if (functionCall.name === 'create_implementation_plan' && functionCall.args?.steps) {
          steps = Array.isArray(functionCall.args.steps) ? functionCall.args.steps : [];
          hasValidPlan = true;
          console.log(`[planner] Successfully extracted ${steps.length} steps from function call`);
          break;
        }
      } else if (chunk.text) {
        console.log("[planner] Text chunk received (no function call)");
      }
    }

    // Fallback to text parsing if no function call
    if (!hasValidPlan) {
      console.log("[planner] No function call found, using fallback");
      steps = [
        { 
          step: 1, 
          description: "Analyze the request and implement the requested functionality", 
          expected_outcome: "Working implementation of the requested feature" 
        }
      ];
    }

    // Add completed status to steps
    const stepsWithStatus = Array.isArray(steps)
      ? steps.map(step =>
          typeof step === 'object' && step !== null
            ? { ...step, completed: false }
            : step
        )
      : steps;

    // Write steps to scratchpad.json
    try {
      fs.writeFileSync(path.join(process.cwd(), "data", "scratchpad.json"), JSON.stringify(stepsWithStatus, null, 2));
    } catch (e) {
      console.error("Error writing steps to scratchpad.json:", e);
    }

    return NextResponse.json(steps);

  } catch (error) {
    console.error("[planner] Error:", error);
    return NextResponse.json(
      [{ step: 1, description: "Failed to generate plan", expected_outcome: "Error occurred" }], 
      { status: 500 }
    );
  }
}