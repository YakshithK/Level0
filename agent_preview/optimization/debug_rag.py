import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Quick debug script
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("phaser_index.faiss")

chunks = []
with open("phaser_chunks.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            chunks.append(json.loads(line)["chunk"])

query = "player movement"
query_embedding = model.encode([query])
faiss.normalize_L2(query_embedding.astype('float32'))

distances, indices = index.search(query_embedding.astype("float32"), 10)

print(f"Query: {query}")
print(f"Top 10 similarities:")
for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
    if idx < len(chunks):
        print(f"  {i+1}. Similarity: {dist:.3f}")
        print(f"     Preview: {chunks[idx][:150]}...")
        print()
