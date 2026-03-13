import os
import re
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("Warning: groq not installed. Using template responses.")

class RAGEngine:
    def __init__(self, vector_store, knowledge_graph, model_name: str = "all-MiniLM-L6-v2"):
        self.embedding_model = SentenceTransformer(model_name)
        self.chunk_size = 500
        self.chunk_overlap = 50
        self.vector_store = vector_store
        self.knowledge_graph = knowledge_graph
        self.groq_client = None
        if GROQ_AVAILABLE:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                print("✅ Groq AI initialized successfully (FREE)")
            else:
                print("⚠️ Warning: GROQ_API_KEY not found in environment variables")

    def chunk_document(self, text: str) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            chunks.append(text[start:end])
            start += self.chunk_size - self.chunk_overlap
        return chunks

    def embed_chunks(self, chunks: List[str]) -> np.ndarray:
        return self.embedding_model.encode(chunks)

    def answer_query(self, query: str):
        query_vec = self.embedding_model.encode([query])
        results = self.vector_store.search(query_vec, top_k=5)
        context = '\n'.join([r['text'] for r in results])
        sources = [r['metadata'] for r in results]
        answer = ""
        if self.groq_client:
            completion = self.groq_client.chat(
                messages=[{"role": "system", "content": "You are a cosmic assistant."}, {"role": "user", "content": f"{context}\n\n{query}"}],
                model="mixtral-8x7b-32768",
                temperature=0.7,
                max_tokens=512
            )
            answer = completion.choices[0].message.content
        else:
            answer = f"[Template] Answer for: {query}\nContext: {context[:200]}..."
        return answer, sources
