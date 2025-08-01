import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict

class PhaserRAGRetriever:
    """Enhanced retriever that integrates RAG with your existing agent"""
    
    def __init__(self, index_path="optimization/phaser_index.faiss", 
                 meta_path="optimization/phaser_chunks.jsonl", 
                 model_name="all-MiniLM-L6-v2"):
        self.model = None
        self.index = None
        self.chunks = []
        self.enabled = False
        
        # Try to load RAG system (graceful fallback if not available)
        try:
            if os.path.exists(index_path) and os.path.exists(meta_path):
                print(f"🔍 Loading Phaser RAG system...")
                self.model = SentenceTransformer(model_name)
                self.index = faiss.read_index(index_path)
                
                with open(meta_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            self.chunks.append(json.loads(line)["chunk"])
                
                self.enabled = True
                print(f"✅ RAG system loaded with {len(self.chunks)} Phaser code examples")
            else:  
                print("⚠️ RAG system not found - continuing without code examples")
        except Exception as e:
            print(f"⚠️ Failed to load RAG system: {e}")
    
    def get_relevant_examples(self, user_prompt: str, top_k: int = 3) -> str:
        """Get relevant Phaser code examples for the user's request"""
        if not self.enabled or not self.model or not self.index:
            return ""
        
        try:
            # Embed the user prompt
            query_embedding = self.model.encode([user_prompt])
            
            # Search for similar code
            distances, indices = self.index.search(
                np.array(query_embedding).astype("float32"), 
                top_k
            )
            
            # Format results
            context = "\n📚 Relevant Phaser.js Examples:\n"
            
            for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
                if idx < len(self.chunks):
                    similarity = 1 / (1 + dist)
                    if similarity > 0.3:  # Only include reasonably similar examples
                        context += f"\nExample {i+1}:\n```javascript\n{self.chunks[idx][:500]}...\n```\n"
            
            return context if len(context) > 50 else ""
            
        except Exception as e:
            print(f"⚠️ RAG search failed: {e}")
            return ""
    
    def enhance_prompt(self, original_prompt: str, user_request: str) -> str:
        """Enhance the system prompt with relevant Phaser examples"""
        examples = self.get_relevant_examples(user_request)
        
        if examples:
            enhanced = f"""{original_prompt}

{examples}

Use these examples as reference for Phaser.js best practices and patterns. Adapt the patterns shown above to fulfill the user's specific request."""
            return enhanced
        
        return original_prompt

# Integration function for your existing agent
def integrate_rag_with_agent():
    """Example of how to integrate RAG with your existing executorAgent"""
    
    # Initialize RAG retriever
    rag = PhaserRAGRetriever()
    
    def enhanced_execute_task(task_description, model="openai"):
        """Enhanced version of your execute_task function with RAG"""
        
        # Your existing system prompt
        original_system_prompt = """You are an expert Phaser.js game developer. Create complete, working game code that follows best practices."""
        
        # Enhance with RAG examples
        enhanced_prompt = rag.enhance_prompt(original_system_prompt, task_description)
        
        # Rest of your existing logic...
        # (buildPrompt, API calls, etc.)
        
        return enhanced_prompt
    
    return enhanced_execute_task

# Test function
def test_rag():
    rag = PhaserRAGRetriever()
    
    test_queries = [
        "create a space shooter with player movement",
        "spawn enemies from the top of the screen",
        "bullet shooting mechanics",
        "collision detection between sprites",
        "particle effects for explosions"
    ]
    
    for query in test_queries:
        print(f"\n🔎 Query: {query}")
        examples = rag.get_relevant_examples(query, top_k=2)
        if examples:
            print(examples[:300] + "...")
        else:
            print("No relevant examples found")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "search":
        # Command line usage: python rag_retriever.py search "query" top_k
        query = sys.argv[2] if len(sys.argv) > 2 else "phaser game"
        top_k = int(sys.argv[3]) if len(sys.argv) > 3 else 3
        
        rag = PhaserRAGRetriever()
        examples = rag.get_relevant_examples(query, top_k)
        print(examples)
    else:
        test_rag()
