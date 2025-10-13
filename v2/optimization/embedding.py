import json
import os
import argparse
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

# ---------- CONFIG ----------
CHUNK_SIZE = 1000  # Max characters per chunk
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DIM = 384  # Embedding dimension

# ---------- CHUNK FUNCTION ----------
def chunk_code(code, max_chunk_size=CHUNK_SIZE):
    chunks = []
    current_chunk = ""
    for line in code.split("\n"):
        if len(current_chunk) + len(line) < max_chunk_size:
            current_chunk += line + "\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = line + "\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# ---------- MAIN ----------
def build_vector_db(json_path, output_index_path, output_meta_path):
    print(f"🔍 Loading model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print(f"📖 Reading JSON: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    # Check if it's a single JSON array or JSONL format
    try:
        # Try parsing as single JSON array first
        if content.startswith('['):
            data = json.loads(content)
        else:
            # Try parsing as JSONL (one JSON object per line)
            data = []
            for line_num, line in enumerate(content.split('\n'), 1):
                line = line.strip()
                if line:
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"⚠️ Skipping invalid JSON on line {line_num}: {e}")
                        print(f"   Line content: {line[:100]}...")
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON file: {e}")
        return

    print(f"📊 Loaded {len(data)} entries from JSON")
    
    # Debug: show first few entries
    if len(data) > 0:
        print("🔍 Sample entry structure:")
        sample = data[0]
        print(f"   Keys: {list(sample.keys()) if isinstance(sample, dict) else 'Not a dict'}")
        if isinstance(sample, dict) and 'content' in sample:
            content_preview = sample['content'][:100] + "..." if len(sample['content']) > 100 else sample['content']
            print(f"   Content preview: {content_preview}")
    else:
        print("⚠️ JSON file contains no entries")

    all_chunks = []
    for entry in data:
        # Try multiple possible content fields
        code = ""
        
        # Check for 'content' field (original expected format)
        if 'content' in entry:
            code = entry['content']
        
        # Check for 'full_file' field (your JSON format)
        elif 'functions' in entry and isinstance(entry['functions'], dict):
            if 'full_file' in entry['functions']:
                code = entry['functions']['full_file']
        
        # Also try direct 'full_file' field
        elif 'full_file' in entry:
            code = entry['full_file']
            
        if code and isinstance(code, str):
            chunks = chunk_code(code)
            all_chunks.extend(chunks)
            print(f"   Added {len(chunks)} chunks from: {entry.get('path', 'unknown path')}")
        else:
            print(f"   Skipped entry (no valid code content): {entry.get('path', 'unknown')}")

    print(f"📦 Total chunks: {len(all_chunks)}")
    
    if len(all_chunks) == 0:
        print("❌ No chunks found! Check your JSON file format.")
        print("Expected format: JSON array with objects containing 'content' field")
        print("Example: [{'content': 'your code here'}, ...]")
        return
    
    print("🧠 Embedding chunks...")
    embeddings = model.encode(all_chunks, show_progress_bar=True)
    
    # Ensure embeddings is 2D array
    if len(embeddings.shape) == 1:
        embeddings = embeddings.reshape(1, -1)

    print("💾 Building FAISS index...")
    index = faiss.IndexFlatL2(DIM)
    index.add(np.array(embeddings).astype("float32"))
    faiss.write_index(index, output_index_path)

    print("📝 Saving metadata...")
    with open(output_meta_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps({"chunk": chunk}) + "\n")

    print("✅ Done. Vector DB and metadata saved.")

# ---------- ARGS ----------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build vector DB from phaser_snippets.json")
    parser.add_argument("--json", required=True, help="Path to phaser_snippets.json")
    parser.add_argument("--index_out", default="phaser_index.faiss", help="FAISS index output path")
    parser.add_argument("--meta_out", default="phaser_chunks.jsonl", help="Chunk metadata output path")

    args = parser.parse_args()
    build_vector_db(args.json, args.index_out, args.meta_out)
