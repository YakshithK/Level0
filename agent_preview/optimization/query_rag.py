import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import argparse

class PhaserRAG:
    def __init__(self, index_path="phaser_index.faiss", meta_path="phaser_chunks.jsonl", model_name="all-MiniLM-L6-v2"):
        print(f"🔍 Loading RAG system...")
        self.model = SentenceTransformer(model_name)
        self.index = faiss.read_index(index_path)
        
        # Load metadata (code chunks)
        self.chunks = []
        with open(meta_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.chunks.append(json.loads(line)["chunk"])
        
        print(f"✅ Loaded {len(self.chunks)} code chunks")
    
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
                
                # Only include high-quality results
                if similarity > 0.5:  # Much higher threshold
                    chunk = self.chunks[idx]
                    
                    # Additional quality filters
                    if self._is_relevant_chunk(chunk, query):
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
        
        # Must contain actual game code
        game_indicators = [
            "phaser", "sprite", "scene", "player", "enemy", "bullet",
            "physics", "collision", "velocity", "keyboard", "input"
        ]
        
        if not any(indicator in chunk_lower for indicator in game_indicators):
            return False
        
        # Query-specific relevance
        query_words = query_lower.split()
        chunk_words = chunk_lower.split()
        
        # Check for word overlap
        overlap = len(set(query_words) & set(chunk_words))
        return overlap >= min(2, len(query_words) // 2)  # At least half the query words
    
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
    
    args = parser.parse_args()
    
    # Initialize RAG system
    rag = PhaserRAG(args.index, args.meta)
    
    # Search
    print(f"\n🔎 Searching for: '{args.query}'\n")
    results = rag.search(args.query, args.top_k)
    
    # Display results
    for result in results:
        print(f"📄 Rank {result['rank']} (Similarity: {result['similarity']:.3f})")
        print(f"```javascript\n{result['code'][:200]}...\n```\n")
    
    # Show formatted context
    print("🤖 Formatted context for LLM:")
    print("=" * 50)
    print(rag.format_context(results))

if __name__ == "__main__":
    main()
