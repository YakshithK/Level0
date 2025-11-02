import exampleData from "../data/examples.json";

export interface Example {
  name: string;
  description: string;
  tags: string[];
  files: Record<string, string>;
  embedding?: number[];
}

export interface ExampleWithScore extends Example {
  score: number;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search examples using semantic similarity
export function searchExamples(queryEmbedding: number[], topK = 3): ExampleWithScore[] {
  const examples = exampleData.examples as Example[];
  
  const scored = examples
    .filter(ex => ex.embedding && ex.embedding.length > 0)
    .map(example => ({
      ...example,
      score: cosineSimilarity(queryEmbedding, example.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  return scored;
}

// Get all examples
export function getAllExamples(): Example[] {
  return exampleData.examples as Example[];
}

// Get example by name
export function getExampleByName(name: string): Example | undefined {
  const examples = exampleData.examples as Example[];
  return examples.find(ex => ex.name === name);
}
