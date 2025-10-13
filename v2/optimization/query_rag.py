import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN for faster startup

import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import argparse
import warnings
import sys
warnings.filterwarnings('ignore')  # Suppress warnings

class PhaserRAG:
    def __init__(self, index_path="phaser_index.faiss", meta_path="phaser_chunks.jsonl", model_name="all-MiniLM-L6-v2"):
        print("Loading RAG system...", file=sys.stderr)  # Send to stderr
        self.model = SentenceTransformer(model_name)
        self.index = faiss.read_index(index_path)
        
        # Load metadata (code chunks)
        self.chunks = []
        with open(meta_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.chunks.append(json.loads(line)["chunk"])
        
        print(f"Loaded {len(self.chunks)} code chunks", file=sys.stderr)  # Send to stderr
    
    def search(self, query, top_k=5):
        """Search for similar code chunks based on the query"""
        # Embed the query
        query_embedding = self.model.encode([query])
        
        # Normalize for cosine similarity
        import faiss
        faiss.normalize_L2(query_embedding.astype('float32'))
        
        # Search the index
        distances, indices = self.index.search(
            query_embedding.astype("float32"), 
            min(top_k * 3, len(self.chunks))  # Get more results to filter
        )
        
        # Get the matching chunks with better filtering
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.chunks):
                similarity = float(dist)  # Already cosine similarity due to normalization
                
                # Include all results above minimal threshold
                if similarity > 0.15:  # Reasonable threshold for UI queries
                    chunk = self.chunks[idx]
                    
                    # Basic quality check - ensure it's actual code
                    if len(chunk.strip()) > 20 and ('class' in chunk or 'function' in chunk or 'const' in chunk or '{' in chunk):
                        results.append({
                            "rank": len(results) + 1,
                            "similarity": similarity,
                            "code": chunk
                        })
                        
                        if len(results) >= top_k:
                            break
        
        return results
    
    def _is_relevant_chunk(self, chunk, query):
        """Check if chunk is actually relevant to the query"""
        chunk_lower = chunk.lower()
        query_lower = query.lower()
        
        # Skip obvious documentation
        if any(doc_indicator in chunk_lower for doc_indicator in [
            "@license", "@copyright", "webpack", "module.exports =", "/*!"
        ]):
            return False
        
        # Must contain actual game code or relevant terms
        game_indicators = [
            "phaser", "sprite", "scene", "player", "enemy", "bullet",
            "physics", "collision", "velocity", "keyboard", "input",
            "color", "background", "text", "rectangle", "create", "preload"
        ]
        
        if not any(indicator in chunk_lower for indicator in game_indicators):
            return False
        
        # Query-specific relevance
        query_words = query_lower.split()
        chunk_words = chunk_lower.split()
        
        # Check for word overlap (more lenient)
        overlap = len(set(query_words) & set(chunk_words))
        return overlap >= max(1, len(query_words) // 3)  # At least one relevant word
    
    def format_context(self, results, max_chars=3000):
        """Format search results into context for LLM prompting"""
        context = "Here are relevant Phaser.js code examples:\n\n"
        
        char_count = len(context)
        for result in results:
            snippet = f"Example {result['rank']} (similarity: {result['similarity']:.3f}):\n"
            snippet += f"```javascript\n{result['code']}\n```\n\n"
            
            if char_count + len(snippet) > max_chars:
                break
            
            context += snippet
            char_count += len(snippet)
        
        return context

def main():
    parser = argparse.ArgumentParser(description="Query Phaser RAG system")
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument("--top_k", type=int, default=5, help="Number of results")
    parser.add_argument("--index", default="phaser_index.faiss", help="FAISS index path")
    parser.add_argument("--meta", default="phaser_chunks.jsonl", help="Metadata path")
    parser.add_argument("--json", action="store_true", help="Output JSON for API")
    
    args = parser.parse_args()
    
    # Initialize RAG system
    rag = PhaserRAG(args.index, args.meta)
    
    # Search
    results = rag.search(args.query, args.top_k)
    
    if args.json:
        # Output JSON for Node.js integration
        # Filter out empty or very short chunks
        valid_chunks = []
        valid_similarities = []
        
        for i, result in enumerate(results):
            chunk = result['code'].strip()
            # More lenient validation - just check it's not empty and has some structure
            if len(chunk) > 10 and ('{' in chunk or 'function' in chunk or 'class' in chunk or '=' in chunk):
                valid_chunks.append(chunk)
                valid_similarities.append(result['similarity'])
        
        output = {
            "chunks": valid_chunks,
            "similarities": valid_similarities
        }
        print(json.dumps(output))
    else:
        # Display results for human (send to stderr to not interfere with JSON output)
        print(f"\nSearching for: '{args.query}'\n", file=sys.stderr)
        for result in results:
            print(f"Rank {result['rank']} (Similarity: {result['similarity']:.3f})", file=sys.stderr)
            print(f"```javascript\n{result['code'][:200]}...\n```\n", file=sys.stderr)
        
        # Show formatted context
        print("Formatted context for LLM:", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        print(rag.format_context(results), file=sys.stderr)

if __name__ == "__main__":
    main()
