#!/usr/bin/env python3
"""
Debug script to see similarity scores for long queries
"""

import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Load the model and database
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("phaser_index.faiss")

# Load chunks
chunks = []
with open("phaser_chunks.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            chunks.append(json.loads(line)["chunk"])

# Test query
query = "Implement color changes in UIScene.js. Adjust the health bar colors (this.healthBar and this.healthBarBg) to fit the color scheme. Also, modify the color of any text elements displaying score, health, or other UI information."

print(f"Testing query: {query[:100]}...")
print(f"Database has {len(chunks)} chunks")

# Search
query_embedding = model.encode([query])
faiss.normalize_L2(query_embedding.astype('float32'))

distances, indices = index.search(query_embedding.astype('float32'), 10)

print(f"\nTop 10 results:")
for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
    if idx < len(chunks):
        print(f"{i+1}. Similarity: {dist:.4f}")
        print(f"   Chunk: {chunks[idx][:150]}...")
        print()
