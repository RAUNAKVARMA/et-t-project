import os
from typing import List, Tuple

import numpy as np
from fastembed import TextEmbedding

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("Warning: groq not installed. Using template responses.")


class RAGEngine:
    def __init__(
        self,
        vector_store,
        knowledge_graph,
        model_name: str = "BAAI/bge-small-en-v1.5",
    ):
        self.embedding_model = TextEmbedding(model_name=model_name)
        self.chunk_size = 500
        self.chunk_overlap = 50
        self.vector_store = vector_store
        self.knowledge_graph = knowledge_graph
        self.groq_client = None
        if GROQ_AVAILABLE:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                print("Groq AI initialized successfully.")
            else:
                print("Warning: GROQ_API_KEY not found in environment variables.")

    def chunk_document(self, text: str) -> List[str]:
        chunks: List[str] = []
        start = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            chunks.append(text[start:end])
            start += self.chunk_size - self.chunk_overlap
        return chunks

    def embed_chunks(self, chunks: List[str]) -> np.ndarray:
        return np.array(list(self.embedding_model.embed(chunks)))

    def answer_query(self, query: str) -> Tuple[str, list]:
        query_vec = np.array(list(self.embedding_model.embed([query])))
        results = self.vector_store.search(query_vec, top_k=5)
        context = '\n'.join([r['text'] for r in results])
        sources = [r['metadata'] for r in results]
        answer = ""
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a cosmic assistant."},
                        {"role": "user", "content": f"{context}\n\n{query}"},
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.7,
                    max_tokens=512,
                )
                answer = completion.choices[0].message.content or ""
            except Exception as exc:
                print(f"Groq request failed: {exc}")
                answer = (
                    f"AI service error: {type(exc).__name__}: {exc}\n\n"
                    f"The query was received but the AI could not generate a response. "
                    f"This may be a temporary issue — please try again."
                )
        else:
            answer = f"[Template] Answer for: {query}\nContext: {context[:200]}..."
        return answer, sources
