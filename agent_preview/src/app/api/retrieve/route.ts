import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text: string) {
  const embedder = await pipeline("feature-extraction", "Xenova/e5-small-v2");
  const result = await embedder(text);
  const embedding = Array.isArray(result.data[0]) ? result.data[0] : Array.from(result.data);
  return embedding;
}

export async function POST(request: Request) {
  const { prompt, topK = 5 } = await request.json();
  const chunks = JSON.parse(fs.readFileSync(path.join(process.cwd(), "code_chunks.json"), "utf8"));
  const promptEmbedding = await getEmbedding(prompt);
  const scored = chunks.map((chunk: any) => ({
    ...chunk,
    score: cosineSimilarity(promptEmbedding, chunk.embedding)
  }));
  scored.sort((a: any, b: any) => b.score - a.score);
  return NextResponse.json(scored.slice(0, topK));
}
