import hashlib
import os
from typing import List, Tuple

import numpy as np

try:
    from fastembed import TextEmbedding

    USE_FASTEMBED = True
except ImportError:
    USE_FASTEMBED = False
    TextEmbedding = None  # type: ignore
    print(
        "Warning: fastembed not installed — using stable pseudo-embeddings. "
        "Install fastembed (may need Rust on Windows) for semantic search."
    )

try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("Warning: groq not installed. Using template responses.")


def _stable_embed(texts: List[str], dim: int = 384) -> np.ndarray:
    """Deterministic vectors when fastembed is unavailable (same text → same vector)."""
    out = np.zeros((len(texts), dim), dtype=np.float32)
    for i, t in enumerate(texts):
        seed = int.from_bytes(hashlib.sha256(t.encode("utf-8", errors="replace")).digest()[:8], "little")
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(dim).astype(np.float32)
        n = float(np.linalg.norm(v)) + 1e-9
        out[i] = v / n
    return out


class RAGEngine:
    def __init__(
        self,
        vector_store,
        knowledge_graph,
        model_name: str = "BAAI/bge-small-en-v1.5",
    ):
        self._embedding_dim = 384
        self.embedding_model = TextEmbedding(model_name=model_name) if USE_FASTEMBED else None
        self.chunk_size = 500
        self.chunk_overlap = 50
        self.vector_store = vector_store
        self.knowledge_graph = knowledge_graph
        self.groq_client = None
        if GROQ_AVAILABLE:
            api_key = (os.getenv("GROQ_API_KEY") or "").strip()
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
        if self.embedding_model is not None:
            return np.array(list(self.embedding_model.embed(chunks)))
        return _stable_embed(chunks, self._embedding_dim)

    def answer_query(self, query: str) -> Tuple[str, list]:
        if self.embedding_model is not None:
            query_vec = np.array(list(self.embedding_model.embed([query])))
        else:
            query_vec = _stable_embed([query], self._embedding_dim)
        results = self.vector_store.search(query_vec, top_k=5)
        context = "\n".join([r["text"] for r in results])
        sources = [r["metadata"] for r in results]
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
                err = f"{type(exc).__name__}: {exc}".lower()
                if "401" in err or "invalid_api_key" in err or "authentication" in err:
                    answer = (
                        "Groq rejected the API key (invalid or expired).\n\n"
                        "1. Open https://console.groq.com/keys and create a new secret key.\n"
                        "2. Put it in et-t-project/backend/.env as: GROQ_API_KEY=gsk_...\n"
                        "3. Restart the FastAPI server (npm run dev:api or run-dev.ps1).\n\n"
                        "Your documents were retrieved; only the LLM call failed."
                    )
                else:
                    answer = (
                        f"AI service error: {type(exc).__name__}: {exc}\n\n"
                        "The query was received but the AI could not generate a response. "
                        "This may be a temporary issue — please try again."
                    )
        else:
            answer = f"[Template] Answer for: {query}\nContext: {context[:200]}..."
        return answer, sources
