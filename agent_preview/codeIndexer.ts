import fs from "fs";
import path from "path";
import { Project } from "ts-morph";
import { pipeline } from "@xenova/transformers";

const SRC_DIR = path.join(process.cwd(), "example-project");
const MAX_CHUNK_SIZE = 150;

function chunkCode(code: string, maxLines: number) {
  const lines = code.split("\n");
  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join("\n"));
  }
  return chunks;
}

function getAllFiles(dir: string, exts: string[] = [".ts", ".tsx", ".js"]) {
  let results: string[] = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, exts));
    } else if (exts.some((ext) => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  return results;
}

function extractSymbols(filePath: string) {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  const symbols: any[] = [];

  sourceFile.getFunctions().forEach((fn: any) => {
    symbols.push({
      file: filePath,
      symbol: fn.getName() || "anonymous",
      code: fn.getText(),
    });
  });
  sourceFile.getClasses().forEach((cls: any) => {
    symbols.push({
      file: filePath,
      symbol: cls.getName() || "anonymous",
      code: cls.getText(),
    });
  });
  sourceFile.getVariableDeclarations().forEach((v: any) => {
    if (v.isExported()) {
      symbols.push({
        file: filePath,
        symbol: v.getName(),
        code: v.getText(),
      });
    }
  });
  return symbols;
}

async function getEmbedding(text: string) {
  const embedder = await pipeline("feature-extraction", "Xenova/e5-small-v2");
  const result = await embedder(text);
  // Flatten the array safely
  const embedding = Array.isArray(result.data[0])
    ? result.data[0]
    : Array.from(result.data);
  return embedding;
}

async function main() {
  const files = getAllFiles(SRC_DIR);
  let allChunks: any[] = [];
  for (const file of files) {
    const symbols = extractSymbols(file);
    for (const symbol of symbols) {
      const chunks = chunkCode(symbol.code, MAX_CHUNK_SIZE);
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        allChunks.push({
          file: path.relative(process.cwd(), file),
          symbol: symbol.symbol,
          code: chunk,
          embedding,
        });
      }
    }
  }
  fs.writeFileSync("code_chunks.json", JSON.stringify(allChunks, null, 2));
}

main();
