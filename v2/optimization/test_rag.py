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
            min(top_k * 2, len(self.chunks))  # Get more results to filter
        )
        
        # Get the matching chunks with better filtering
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.chunks):
                similarity = float(dist)  # Already cosine similarity due to normalization
                
                # Lower threshold for testing
                if similarity > 0.3:  # Lower threshold to see results
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
            "physics", "collision", "velocity", "keyboard", "input", "create", "update", "preload"
        ]
        
        if not any(indicator in chunk_lower for indicator in game_indicators):
            return False
        
        # Always return true for now to see what we get
        return True
    
    def format_context(self, results, max_chars=3000):
        """Format search results into context for LLM prompting"""
        context = "Here are relevant Phaser.js code examples:\n\n"
        
        char_count = len(context)
        for result in results:
            code_snippet = result["code"]
            similarity = result["similarity"]
            
            example_text = f"Example {result['rank']} (similarity: {similarity:.3f}):\n```javascript\n{code_snippet[:800]}\n```\n\n"
            
            if char_count + len(example_text) <= max_chars:
                context += example_text
                char_count += len(example_text)
            else:
                break
        
        return context

def main():
    parser = argparse.ArgumentParser(description="Query Phaser code database")
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument("--top_k", type=int, default=5, help="Number of results")
    
    args = parser.parse_args()
    
    # Initialize RAG system
    rag = PhaserRAG()
    
    print(f"🔎 Searching for: '{args.query}'")
    
    # Search for relevant code
    results = rag.search(args.query, args.top_k)
    
    # Display results
    if results:
        for result in results:
            print(f"\n📄 Rank {result['rank']} (Similarity: {result['similarity']:.3f})")
            print(f"```javascript\n{result['code'][:400]}...\n```")
    else:
        print("No relevant results found")
    
    # Format for LLM
    print(f"\n🤖 Formatted context for LLM:")
    print("=" * 50)
    context = rag.format_context(results)
    print(context)

if __name__ == "__main__":
    main()
