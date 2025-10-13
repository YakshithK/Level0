import json
import os
import argparse
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import re

# ---------- CONFIG ----------
CHUNK_SIZE = 800  # Smaller chunks for better precision
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DIM = 384  # Embedding dimension

def is_useful_chunk(chunk):
    """Filter out useless code chunks"""
    # Skip if too small
    if len(chunk.strip()) < 100:
        return False
    
    # Skip obvious garbage
    garbage_indicators = [
        "webpack", "@license", "@copyright", "module.exports =", 
        "/*!", "eslint", "prettier", "babel", "*/\n\n/***"
    ]
    
    if any(indicator in chunk.lower() for indicator in garbage_indicators):
        return False
    
    # Must contain useful game code patterns
    useful_patterns = [
        # Phaser objects and methods
        r"Phaser\.\w+", r"this\.(player|enemy|bullet)", r"this\.(physics|input|time)",
        r"this\.add\.(sprite|image|text)", r"this\.load\.\w+", 
        
        # Game logic patterns
        r"(preload|create|update)\s*\(", r"collision", r"velocity", 
        r"setVelocity", r"keyboard", r"cursors", r"overlap",
        
        # Scene and game patterns
        r"extends Phaser\.Scene", r"Phaser\.Game", r"scene\.start"
    ]
    
    return any(re.search(pattern, chunk, re.IGNORECASE) for pattern in useful_patterns)

def smart_chunk_game_code(code, max_chunk_size=CHUNK_SIZE):
    """Intelligently chunk game code preserving context"""
    if not is_useful_chunk(code):
        return []
    
    chunks = []
    
    # Try to extract meaningful code blocks first
    patterns = {
        "scene_class": r"class\s+\w+\s+extends\s+Phaser\.Scene\s*\{.*?\n\}",
        "preload_method": r"preload\s*\([^)]*\)\s*\{.*?\n\s*\}",
        "create_method": r"create\s*\([^)]*\)\s*\{.*?\n\s*\}",
        "update_method": r"update\s*\([^)]*\)\s*\{.*?\n\s*\}",
        "game_config": r"(?:const|var|let)\s+config\s*=\s*\{.*?\n\s*\}",
        "sprite_logic": r"(?:class|function).*?(?:sprite|player|enemy).*?\{.*?\n\s*\}"
    }
    
    found_meaningful = False
    
    for pattern_name, pattern in patterns.items():
        matches = re.findall(pattern, code, re.DOTALL | re.IGNORECASE)
        for match in matches:
            if len(match) > 50 and is_useful_chunk(match):
                # Add context label
                labeled_chunk = f"// {pattern_name.replace('_', ' ').title()}\n{match}"
                chunks.append(labeled_chunk[:max_chunk_size])
                found_meaningful = True
    
    # If no meaningful patterns found, do line-based chunking
    if not found_meaningful:
        lines = code.split('\n')
        current_chunk = ""
        
        for line in lines:
            # Skip empty lines and comments at start of chunks
            if not current_chunk and (not line.strip() or line.strip().startswith('//')):
                continue
                
            if len(current_chunk) + len(line) + 1 <= max_chunk_size:
                current_chunk += line + '\n'
            else:
                if current_chunk.strip() and is_useful_chunk(current_chunk):
                    chunks.append(current_chunk.strip())
                current_chunk = line + '\n'
        
        # Add final chunk
        if current_chunk.strip() and is_useful_chunk(current_chunk):
            chunks.append(current_chunk.strip())
    
    return chunks

def extract_code_from_snippet(snippet):
    """Extract code from different snippet formats"""
    if isinstance(snippet, dict):
        # New format from scrape_v2.py
        if "code" in snippet:
            return snippet["code"]
        # Old format fallback
        elif "functions" in snippet and "full_file" in snippet["functions"]:
            return snippet["functions"]["full_file"]
    elif isinstance(snippet, str):
        # Direct string
        return snippet
    
    return None

def build_vector_db(json_path, output_index_path, output_meta_path):
    print(f"🔍 Loading model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print(f"📖 Reading JSON: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    # Parse JSON data
    try:
        if content.startswith('['):
            data = json.loads(content)
        else:
            # JSONL format
            data = []
            for line in content.split('\n'):
                line = line.strip()
                if line:
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing failed: {e}")
        return

    print(f"📊 Loaded {len(data)} snippets")

    # Extract and chunk code
    all_chunks = []
    skipped_count = 0
    
    for i, snippet in enumerate(tqdm(data, desc="Processing snippets")):
        code = extract_code_from_snippet(snippet)
        
        if not code:
            skipped_count += 1
            continue
        
        # Smart chunking
        chunks = smart_chunk_game_code(code)
        
        for chunk in chunks:
            if len(chunk.strip()) > 50:  # Final size check
                all_chunks.append(chunk)
    
    print(f"📊 Processing results:")
    print(f"  Total input snippets: {len(data)}")
    print(f"  Skipped (no code): {skipped_count}")
    print(f"  Generated chunks: {len(all_chunks)}")
    print(f"  Average chunk size: {np.mean([len(c) for c in all_chunks]):.0f} chars")

    if not all_chunks:
        print("❌ No valid chunks found!")
        return

    # Generate embeddings
    print(f"🔮 Generating embeddings...")
    embeddings = []
    
    batch_size = 32
    for i in tqdm(range(0, len(all_chunks), batch_size), desc="Creating embeddings"):
        batch = all_chunks[i:i+batch_size]
        batch_embeddings = model.encode(batch, convert_to_numpy=True)
        embeddings.extend(batch_embeddings)

    embeddings = np.array(embeddings).astype('float32')
    print(f"📊 Embeddings shape: {embeddings.shape}")

    # Create FAISS index
    print(f"🗂️ Building FAISS index...")
    index = faiss.IndexFlatIP(DIM)  # Inner product for cosine similarity
    
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embeddings)
    index.add(embeddings)

    # Save index
    print(f"💾 Saving index to: {output_index_path}")
    faiss.write_index(index, output_index_path)

    # Save metadata
    print(f"💾 Saving metadata to: {output_meta_path}")
    with open(output_meta_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps({"chunk": chunk}, ensure_ascii=False) + "\n")

    print("✅ Vector database created successfully!")
    print(f"📊 Final stats:")
    print(f"  Index size: {index.ntotal} vectors")
    print(f"  Quality chunks: {len([c for c in all_chunks if len(c) > 200])}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build vector database from Phaser code")
    parser.add_argument("--json", required=True, help="Input JSON file path")
    parser.add_argument("--index", default="phaser_index.faiss", help="Output FAISS index")
    parser.add_argument("--meta", default="phaser_chunks.jsonl", help="Output metadata file")
    
    args = parser.parse_args()
    
    build_vector_db(args.json, args.index, args.meta)
